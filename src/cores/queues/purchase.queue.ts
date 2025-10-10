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

  private RollbackRedisReserve = async (payload: IJobPurchase) => {
    await this.redisService.incrementStock(
      payload.promoId,
      payload.productId,
      payload.quantity,
    );
  };

  Process = async (payload: IJobPurchase): Promise<void> => {
    const reserved = await this.redisService.reserveStockAtomic(
      payload.promoId,
      payload.productId,
      payload.quantity,
    );

    if (!reserved) {
      this.EmitPurchaseStatus(payload, "NOSTOCK");
      throw new Error("OUT_OF_STOCK");
    }

    try {
      const existingPurchase = await this.db.purchase.findUnique({
        where: { id: payload.purchaseId },
      });

      if (!existingPurchase) {
        throw new Error("PURCHASE_NOT_FOUND");
      }

      const existingPromo = await this.db.promo.findFirst({
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

      const promoProductUpdateResult = await this.db.promoProduct.updateMany({
        where: {
          promoId: payload.promoId,
          productId: payload.productId,
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

      if (promoProductUpdateResult.count === 0) {
        throw new Error("OUT_OF_STOCK");
      }

      const purchase = await this.db.purchase.update({
        where: { id: payload.purchaseId },
        data: {
          status: "COMPLETED",
          updatedAt: new Date(),
        },
      });

      const finalPromoProduct = await this.db.promoProduct.findUnique({
        where: {
          productId_promoId: {
            promoId: payload.promoId,
            productId: payload.productId,
          },
        },
      });
      const finalSoldCount = finalPromoProduct?.sold ?? 0;

      const currentRedisStock = await this.redisService.getStock(
        payload.promoId,
        payload.productId,
      );

      this.socketService.emitStockPromoUpdate(
        payload.promoId,
        payload.productId,
        currentRedisStock,
        finalSoldCount,
      );

      this.EmitPurchaseStatus(payload, "COMPLETED");

      this.logger.log(`Purchase completed: ${purchase.id}`);
      this.logger.log(
        `Stock updated for product ${payload.productId}: DB=${finalPromoProduct?.stock}, Redis=${currentRedisStock}`,
      );
    } catch (error) {
      this.logger.error(
        `Purchase failed for product ${payload.productId}:`,
        error,
      );

      if (error instanceof Error) {
        switch (error.message) {
          case "OUT_OF_STOCK":
          case "PURCHASE_NOT_FOUND":
            await this.RollbackRedisReserve(payload);
            this.EmitPurchaseStatus(payload, "NOSTOCK");
            return;
          case "PROMO_NOT_FOUND":
          case "PROMO_NOT_ACTIVE":
            await this.RollbackRedisReserve(payload);
            this.EmitPurchaseStatus(payload, "INACTIVE");
            return;
        }
      }

      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code: string }).code === "P2025"
      ) {
        await this.RollbackRedisReserve(payload);
        this.EmitPurchaseStatus(payload, "CANCELLED");
        this.logger.warn(
          `Purchase ${payload.purchaseId} was cancelled or not found`,
        );
        return;
      }

      await this.RollbackRedisReserve(payload);

      throw error;
    }
  };
}
