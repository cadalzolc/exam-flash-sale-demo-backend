import { Injectable, Logger } from "@nestjs/common";
import { FormatCode } from "src/lib/common";
import { IOrderResponse, IPurchaseOrder } from "src/lib/models/data";
import { DtoPurchaseOrder } from "src/lib/models/dto";
import { IResponse } from "src/lib/models/interface";
import { DBService } from "./db.service";
import { QueueService } from "./queue.service";

@Injectable()
export class PurchaseService {
  private readonly logger = new Logger(PurchaseService.name);

  constructor(
    private db: DBService,
    private queueService: QueueService,
  ) {}

  private async CheckCustomerPurchase(
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

  Create = async (
    payload: DtoPurchaseOrder,
  ): Promise<IResponse<IOrderResponse>> => {
    const data: IPurchaseOrder = {
      promoId: payload.promoId,
      productId: payload.productId,
      email: payload.email,
      price: payload.price,
      quantity: payload.quantity,
    };

    const hasPurchased = await this.CheckCustomerPurchase(
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
      include: {
        product: true,
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

    const purchase = await this.db.purchase.create({
      data: {
        promoId: payload.promoId,
        productId: payload.productId,
        email: payload.email,
        quantity: payload.quantity,
        price: payload.price,
        total: payload.quantity * payload.price,
        status: "PENDING",
      },
    });

    const orderNo = FormatCode("ORD", purchase.id);

    await this.queueService.addToPurchaseQueue({
      purchaseId: purchase.id,
      transNo: orderNo,
      transDate: purchase.createdAt,
      product: productPromo?.product.name ?? "",
      ...payload,
    });

    return {
      code: "Success",
      message: "Your purchase is now in process",
      data: {
        no: orderNo,
        date: purchase.createdAt,
        amount: purchase.total.toNumber(),
      },
    };
  };
}
