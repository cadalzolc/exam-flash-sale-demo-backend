import { Inject, Injectable } from "@nestjs/common";
import { Redis } from "ioredis";
import { DBService } from "./db.service";

@Injectable()
export class RedisService {
  constructor(
    @Inject("REDIS_CLIENT") private readonly redis: Redis,
    private db: DBService,
  ) {}

  async loadActivePromoStock(): Promise<void> {
    try {
      const allPromoProducts = await this.db.promoProduct.findMany({
        include: {
          promo: {
            select: {
              name: true,
              isActive: true,
              dateStart: true,
              dateEnd: true,
            },
          },
        },
      });

      const pipeline = this.redis.pipeline();

      for (const promoProduct of allPromoProducts) {
        const stockKey = `stock:${promoProduct.promoId}:${promoProduct.productId}`;
        pipeline.set(stockKey, promoProduct.stock);

        const priceKey = `price:${promoProduct.promoId}:${promoProduct.productId}`;
        pipeline.set(priceKey, promoProduct.price.toString());
      }

      await pipeline.exec();

      console.log(
        `Loaded ${allPromoProducts.length} active promo products stock to Redis`,
      );
    } catch (error) {
      console.error("Failed to load promo stock to Redis:", error);
      throw error;
    }
  }

  async reserveStockAtomic(
    promoId: number,
    productId: number,
    quantity: number,
  ): Promise<boolean> {
    const stockKey = `stock:${promoId}:${productId}`;
    const script = `
    local stock = redis.call('GET', KEYS[1])        -- KEYS[1] = "stock:1:123"
    if not stock or tonumber(stock) < tonumber(ARGV[1]) then
      return -1
    end
    return redis.call('DECRBY', KEYS[1], ARGV[1])   -- ARGV[1] = quantity (e.g., 2)
  `;

    const result = await this.redis.eval(script, 1, stockKey, quantity);
    return result !== -1;
  }

  async getStock(promoId: number, productId: number): Promise<number> {
    const stock = await this.redis.get(`stock:${promoId}:${productId}`);
    return parseInt(stock || "0");
  }

  async getPrice(promoId: number, productId: number): Promise<number> {
    const price = await this.redis.get(`price:${promoId}:${productId}`);
    return parseFloat(price || "0");
  }

  async setStock(
    promoId: number,
    productId: number,
    quantity: number,
  ): Promise<void> {
    await this.redis.set(`stock:${promoId}:${productId}`, quantity);
  }

  async incrementStock(
    promoId: number,
    productId: number,
    quantity: number,
  ): Promise<number> {
    return this.redis.incrby(`stock:${promoId}:${productId}`, quantity);
  }

  async getPromoStocks(promoId: number): Promise<Map<number, number>> {
    const keys = await this.redis.keys(`stock:${promoId}:*`);
    const stocks = new Map<number, number>();

    for (const key of keys) {
      const productId = parseInt(key.split(":")[2]);
      const stock = await this.getStock(promoId, productId);
      stocks.set(productId, stock);
    }

    return stocks;
  }

  async onModuleInit() {
    await this.loadActivePromoStock();
  }
}
