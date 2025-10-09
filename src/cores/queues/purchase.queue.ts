import { Injectable, Logger } from "@nestjs/common";
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

  Process = async (payload: IJobPurchase): Promise<void> => {
    const reserved = await this.redisService.reserveStockAtomic(
      payload.promoId,
      payload.productId,
      payload.quantity,
    );

    if (!reserved) {
      this.socketService.emitPurchaseStatus(
        payload.promoId,
        payload.productId,
        "NOSTOCK",
        {
          transNo: payload.transNo,
          transDate: payload.transDate,
          product: payload.product,
          customer: payload.email,
          amount: payload.price,
        },
      );
      throw new Error("Insufficient stock");
    }

    try {
      const promoP = await this.db.promoProduct.update({
        where: {
          productId_promoId: {
            promoId: payload.promoId,
            productId: payload.productId,
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

      const updatedProduct = await this.db.product.update({
        where: { id: payload.productId },
        data: {
          stock: {
            decrement: payload.quantity,
          },
        },
        select: {
          id: true,
          stock: true,
          name: true,
        },
      });

      const purchase = await this.db.purchase.update({
        where: { id: payload.purchaseId },
        data: {
          status: "COMPLETED",
          updatedAt: new Date(),
        },
      });

      const currentRedisStock = await this.redisService.getStock(
        payload.promoId,
        payload.productId,
      );

      this.socketService.emitStockPromoUpdate(
        payload.promoId,
        payload.productId,
        currentRedisStock,
        promoP.sold,
      );

      this.socketService.emitPurchaseStatus(
        payload.promoId,
        payload.productId,
        "COMPLETED",
        {
          transNo: payload.transNo,
          transDate: payload.transDate,
          product: payload.product,
          customer: payload.email,
          amount: payload.price,
        },
      );

      this.logger.log(`Purchase completed: ${purchase.id}`);
      this.logger.log(
        `Stock updated for product ${payload.productId}: DB=${updatedProduct.stock}, Redis=${currentRedisStock}`,
      );
    } catch (error) {
      await this.redisService.incrementStock(
        payload.promoId,
        payload.productId,
        payload.quantity,
      );
      this.logger.error(
        `Purchase failed for product ${payload.productId}:`,
        error,
      );
      throw error;
    }
  };
}
