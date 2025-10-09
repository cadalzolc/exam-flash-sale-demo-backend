import { Injectable } from "@nestjs/common";
import { GetDateStatus } from "src/lib/common";
import { IPromoPeriod, IPromoResponse } from "src/lib/models/data";
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
        stock = 25,
        price = 50000,
        sold = 0,
        max_qty_per_order = 1
      WHERE promo_id = ${promoId} AND product_id IN (1)
    `;

    await this.redisService.loadActivePromoStock();

    return {
      code: "Success",
      message: "Reset completed successfully",
    };
  };

  Info = async (id: number): Promise<IResponse<IPromoResponse>> => {
    const promo = await this.db.promo.findFirst({
      where: {
        id: id,
        isActive: true,
      },
      include: {
        promoProducts: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!promo) {
      return {
        code: "Failed",
        message: "No active promo",
      };
    }

    const status = GetDateStatus(promo.dateStart, promo.dateEnd);

    const result: IPromoResponse = {
      id: promo.id,
      name: promo.name,
      dateStart: promo.dateStart,
      dateEnd: promo.dateEnd,
      status,
      products: promo.promoProducts.map((p) => ({
        id: p.productId,
        promoId: p.promoId,
        name: p.product.name,
        description: p.product.description,
        stock: p.stock,
        sold: p.sold,
        price: p.price.toNumber(),
      })),
    };

    return {
      code: "Success",
      message: `${result.products.length} products available`,
      data: result,
    };
  };
}
