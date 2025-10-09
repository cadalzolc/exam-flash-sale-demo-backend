import { Injectable } from "@nestjs/common";
import { IResponse } from "src/lib/models/interface";
import { DBService } from "./db.service";
import { RedisService } from "./redis.service";

@Injectable()
export class PromoService {
  constructor(
    private db: DBService,
    private redisService: RedisService,
  ) {}

  Reset = async (id: number): Promise<IResponse<undefined>> => {
    await this.db.$executeRaw`TRUNCATE TABLE purchase RESTART IDENTITY CASCADE`;

    await this.db.$executeRaw`
      UPDATE promos_products 
      SET 
        stock = CASE 
          WHEN product_id = 1 AND promo_id = ${id} THEN 25
          WHEN product_id = 3 AND promo_id = ${id} THEN 50
          WHEN product_id = 5 AND promo_id = ${id} THEN 30
        END,
        price = CASE 
          WHEN product_id = 1 AND promo_id = ${id} THEN 800
          WHEN product_id = 3 AND promo_id = ${id} THEN 100
          WHEN product_id = 5 AND promo_id = ${id} THEN 350
        END,
        sold = 0,
        max_qty_per_order = 1
      WHERE promo_id = ${id} AND product_id IN (1, 3, 5)
    `;

    await this.redisService.loadActivePromoStock();

    return {
      code: "Success",
      message: "Reset completed successfully",
    };
  };
}
