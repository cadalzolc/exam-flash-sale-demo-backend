import { Injectable } from "@nestjs/common";
import { IProduct, IPromoPeriod } from "src/lib/models/data";
import { IResponse } from "src/lib/models/interface";
import { DBService } from "./db.service";
import { RedisService } from "./redis.service";

@Injectable()
export class PromoService {
  constructor(
    private db: DBService,
    private redisService: RedisService,
  ) {}

  Reset = async (payload: IPromoPeriod): Promise<IResponse<undefined>> => {
    const { promoId, dateStart, dateEnd } = payload;

    await this.db
      .$executeRaw`TRUNCATE TABLE purchases RESTART IDENTITY CASCADE`;

    await this.db.promo.update({
      where: {
        id: promoId,
      },
      data: {
        dateStart: dateStart,
        dateEnd: dateEnd,
      },
    });

    await this.db.$executeRaw`
      UPDATE promos_products 
      SET 
        stock = CASE 
          WHEN product_id = 1 AND promo_id = ${promoId} THEN 25
          WHEN product_id = 3 AND promo_id = ${promoId} THEN 50
          WHEN product_id = 5 AND promo_id = ${promoId} THEN 30
        END,
        price = CASE 
          WHEN product_id = 1 AND promo_id = ${promoId} THEN 800
          WHEN product_id = 3 AND promo_id = ${promoId} THEN 100
          WHEN product_id = 5 AND promo_id = ${promoId} THEN 350
        END,
        sold = 0,
        max_qty_per_order = 1
      WHERE promo_id = ${promoId} AND product_id IN (1, 3, 5)
    `;

    await this.redisService.loadActivePromoStock();

    return {
      code: "Success",
      message: "Reset completed successfully",
    };
  };

  List = async (id: number): Promise<IResponse<IProduct[]>> => {
    const products = await this.db.promoProduct.findMany({
      where: {
        promoId: id,
      },
      include: {
        product: true,
      },
    });

    const result: IProduct[] = products.map((p) => ({
      id: p.id,
      name: p.product.name,
      description: p.product.description,
      stock: p.stock,
      promoId: p.id,
      price: p.price.toNumber(),
    }));

    return {
      code: "Success",
      message: `${result.length} products available`,
      data: result,
    };
  };
}
