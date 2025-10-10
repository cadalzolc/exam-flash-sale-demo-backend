import { Injectable, Logger } from "@nestjs/common";
import { ExtractId, FormatCode } from "src/lib/common";
import { IOrderResponse, IPurchaseOrder } from "src/lib/models/data";
import { DtoPurchaseOrder } from "src/lib/models/dto";
import { IResponse } from "src/lib/models/interface";
import { DBService } from "./db.service";
import { QueueService } from "./queue.service";
import { RedisService } from "./redis.service";

@Injectable()
export class PurchaseService {
  private readonly logger = new Logger(PurchaseService.name);

  constructor(
    private db: DBService,
    private queueService: QueueService,
    private redisService: RedisService,
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
        code: "Duplicate",
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

    if (!productPromo) {
      return {
        code: "Failed",
        message: "Product not found",
      };
    }

    if (payload.quantity > productPromo.maxQtyPerOrder) {
      return {
        code: "Forbidden",
        message: "Purchase quantity exceeds the limit",
      };
    }

    const isStockReserved = await this.redisService.reserveStockAtomic(
      payload.promoId,
      payload.productId,
      payload.quantity,
    );

    if (!isStockReserved) {
      await this.redisService.incrementStock(
        payload.promoId,
        payload.productId,
        payload.quantity,
      );
      return {
        code: "Forbidden",
        message: "Insufficient stock available. Realtime Inventory",
      };
    }

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

    if (!purchase) {
      return {
        code: "Failed",
        message: "Purchase not created",
      };
    }

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

  Check = async (no: string): Promise<IResponse<string>> => {
    const id = ExtractId(no);

    if (id === 0) {
      return {
        code: "Failed",
        message: "Invalid value or format",
      };
    }

    const purchase = await this.db.purchase.findFirst({
      where: {
        id,
      },
    });

    if (!purchase) {
      return {
        code: "NotFound",
        message: "No record found",
      };
    }

    return {
      code: "Success",
      message: "Found",
      data: purchase.status,
    };
  };
}
