import { Injectable, Logger } from "@nestjs/common";
import { IDataBuy } from "src/lib/models/data";
import { DtoBuy } from "src/lib/models/dto";
import { IResponse } from "src/lib/models/interface";
import { DBService } from "./db.service";
import { QueueService } from "./queue.service";

@Injectable()
export class BuyService {
  private readonly logger = new Logger(BuyService.name);

  constructor(
    private db: DBService,
    private queueService: QueueService,
  ) {}

  private async CheckUserPurchase(
    email: string,
    productId: number,
    promoId: number,
  ): Promise<boolean> {
    const now = new Date();

    const existingPurchase = await this.db.purchase.findFirst({
      where: {
        email: email,
        productId: productId,
        promoId: promoId,
        promo: {
          dateStart: { lte: now },
          dateEnd: { gte: now },
        },
      },
      include: {
        promo: {
          select: {
            dateStart: true,
            dateEnd: true,
          },
        },
      },
    });

    return !!existingPurchase;
  }

  Create = async (payload: DtoBuy): Promise<IResponse<undefined>> => {
    const data: IDataBuy = {
      promoId: payload.promoId,
      productId: payload.productId,
      email: payload.email,
      price: payload.price,
      quantity: payload.quantity,
    };

    const hasPurchased = await this.CheckUserPurchase(
      payload.email,
      payload.productId,
      payload.promoId,
    );

    if (hasPurchased) {
      return {
        code: "Forbidden",
        message: "You have already purchased this product in the flash sale",
      };
    }

    const productPromo = await this.db.promoProduct.findFirst({
      where: {
        promoId: data.promoId,
        productId: data.productId,
      },
    });

    if (
      productPromo?.maxQtyPerOrder &&
      data.quantity > productPromo.maxQtyPerOrder
    ) {
      return {
        code: "Forbidden",
        message: "Purchase quantity exceeds the limit",
      };
    }

    if (productPromo && data.quantity > productPromo.stock) {
      return {
        code: "Forbidden",
        message: "Insufficient stock available",
      };
    }

    this.logger.log(
      `Adding purchase to queue: ${data.email} for product ${data.productId}`,
    );

    await this.queueService.addToPurchaseQueue(data);

    return {
      code: "Success",
      message: "Your purchase is now in process",
    };
  };
}
