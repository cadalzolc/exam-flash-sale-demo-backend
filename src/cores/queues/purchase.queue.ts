import { Injectable, Logger } from "@nestjs/common";
import { GetDateStatus } from "src/lib/common";
import { IJobPurchase } from "src/lib/models/data";
import { DBService } from "../services/db.service";
import { RedisService } from "../services/redis.service";
import { SocketService } from "../services/socket.service";

@Injectable()
export class PurchaseQueue {
  private readonly logger = new Logger(PurchaseQueue.name);

  constructor(
    private db: DBService,
    private redisService: RedisService,
    private socketService: SocketService,
  ) {}

  private EmitPurchaseStatus = (payload: IJobPurchase, status: string) => {
    this.socketService.emitPurchaseStatus(
      payload.promoId,
      payload.productId,
      status,
      {
        transNo: payload.transNo,
        transDate: payload.transDate,
        product: payload.product,
        customer: payload.email,
        amount: payload.price,
      },
    );
  };

  Process = async (payload: IJobPurchase): Promise<void> => {
    try {
      const { purchase, promoProductUpdate } = await this.db.$transaction(
        async (trx) => {
          const existingPurchase = await trx.purchase.findUnique({
            where: { id: payload.purchaseId },
          });

          if (!existingPurchase) {
            this.logger.error(
              `Purchase ${payload.purchaseId} not found in transaction`,
            );
            throw new Error("PURCHASE_NOT_FOUND");
          }

          if (existingPurchase.status === "COMPLETED") {
            this.logger.log(`Purchase ${payload.purchaseId} already completed`);
            return {
              purchase: existingPurchase,
              promoProductUpdate: null,
            };
          }

          const existingPromo = await trx.promo.findFirst({
            where: { id: payload.promoId },
          });

          if (!existingPromo) {
            throw new Error("PROMO_NOT_FOUND");
          }

          const status = GetDateStatus(
            existingPromo.dateStart,
            existingPromo.dateEnd,
          );

          if (status === "EXPIRED" || status === "UPCOMING") {
            throw new Error("PROMO_NOT_ACTIVE");
          }

          const promoProductUpdate = await trx.promoProduct.update({
            where: {
              productId_promoId: {
                promoId: payload.promoId,
                productId: payload.productId,
              },
              stock: {
                gte: payload.quantity,
              },
            },
            data: {
              stock: {
                decrement: payload.quantity,
              },
              sold: {
                increment: payload.quantity,
              },
            },
          });

          this.logger.log(
            `[${payload.purchaseId}] Promo product stock updated: ${promoProductUpdate.stock} remaining`,
          );

          await trx.product.update({
            where: {
              id: payload.productId,
              stock: {
                gte: payload.quantity,
              },
            },
            data: {
              stock: {
                decrement: payload.quantity,
              },
            },
          });

          this.logger.log(`[${payload.purchaseId}] Main product stock updated`);

          const purchase = await trx.purchase.update({
            where: { id: payload.purchaseId },
            data: {
              status: "COMPLETED",
              updatedAt: new Date(),
            },
          });

          this.logger.log(
            `[${payload.purchaseId}] Purchase marked as COMPLETED`,
          );

          return { promoProductUpdate, purchase };
        },
      );

      if (promoProductUpdate) {
        await this.redisService.setStock(
          payload.promoId,
          payload.productId,
          promoProductUpdate.stock,
        );
      }

      const currentRedisStock = await this.redisService.getStock(
        payload.promoId,
        payload.productId,
      );

      const finalPromoProduct = await this.db.promoProduct.findUnique({
        where: {
          productId_promoId: {
            promoId: payload.promoId,
            productId: payload.productId,
          },
        },
      });

      this.socketService.emitStockPromoUpdate(
        payload.promoId,
        payload.productId,
        currentRedisStock,
        finalPromoProduct?.sold || 0,
      );

      this.EmitPurchaseStatus(payload, "COMPLETED");

      this.logger.log(`Purchase completed: ${purchase.id}`);
      this.logger.log(
        `Stock updated for product ${payload.productId}: DB=${promoProductUpdate?.stock}, Redis=${currentRedisStock}`,
      );
    } catch (error) {
      this.logger.error(
        `Purchase failed for product ${payload.productId}:`,
        error,
      );

      if (error instanceof Error) {
        switch (error.message) {
          case "PURCHASE_NOT_FOUND":
            await this.handlePurchaseNotFound(payload);
            return;
          case "PROMO_NOT_FOUND":
          case "PROMO_NOT_ACTIVE":
            await this.handlePromoError(payload, error.message);
            return;
        }
      }

      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code: string }).code === "P2025"
      ) {
        this.handleStockExhaustion(payload);
        return;
      }

      await this.handleUnknownError(payload);
    }
  };

  private handlePurchaseNotFound = async (
    payload: IJobPurchase,
  ): Promise<void> => {
    this.logger.warn(`Purchase ${payload.purchaseId} not found`);
    this.EmitPurchaseStatus(payload, "CANCELLED");
  };

  private handlePromoError = async (
    payload: IJobPurchase,
    errorMessage: string,
  ): Promise<void> => {
    this.logger.warn(
      `Promo error for purchase ${payload.purchaseId}: ${errorMessage}`,
    );

    await this.db.purchase.update({
      where: { id: payload.purchaseId },
      data: {
        status: "NOSTOCK",
        updatedAt: new Date(),
      },
    });

    this.EmitPurchaseStatus(payload, "FAILED");
  };

  private handleStockExhaustion = async (
    payload: IJobPurchase,
  ): Promise<void> => {
    this.logger.log(
      `Stock exhausted for purchase ${payload.purchaseId} - expected behavior`,
    );

    await this.db.purchase.update({
      where: { id: payload.purchaseId },
      data: {
        status: "NOSTOCK",
        updatedAt: new Date(),
      },
    });

    await this.redisService.setStock(payload.promoId, payload.productId, 0);

    this.EmitPurchaseStatus(payload, "NOSTOCK");
  };

  private handleUnknownError = async (payload: IJobPurchase): Promise<void> => {
    this.logger.error(`Unknown error for purchase ${payload.purchaseId}`);

    await this.db.purchase.update({
      where: { id: payload.purchaseId },
      data: {
        status: "NOSTOCK",
        updatedAt: new Date(),
      },
    });

    this.EmitPurchaseStatus(payload, "FAILED");
  };
}
