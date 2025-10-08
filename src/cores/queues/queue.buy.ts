import { Injectable, Logger } from "@nestjs/common";
import { IDataBuy } from "src/lib/models/data";
import { DBService } from "../services/db.service";
import { RedisService } from "../services/redis.service";
import { SocketService } from "../services/socket.service";

@Injectable()
export class BuyQueues {
  private readonly logger = new Logger(BuyQueues.name);

  constructor(
    private db: DBService,
    private redisService: RedisService,
    private socketService: SocketService,
  ) {}

  Process = async (payload: IDataBuy): Promise<void> => {
    const reserved = await this.redisService.reserveStockAtomic(
      payload.promoId,
      payload.productId,
      payload.quantity,
    );

    if (!reserved) {
      throw new Error("Insufficient stock");
    }

    try {
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

      const newData = {
        promoId: payload.promoId,
        productId: payload.productId,
        email: payload.email,
        quantity: payload.quantity,
        price: payload.price,
        total: payload.quantity * payload.price,
      };

      const purchase = await this.db.purchase.create({
        data: newData,
      });

      const currentRedisStock = await this.redisService.getStock(
        payload.promoId,
        payload.productId,
      );

      this.socketService.emitStockUpdateToProduct(
        payload.promoId,
        payload.productId,
        currentRedisStock,
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
