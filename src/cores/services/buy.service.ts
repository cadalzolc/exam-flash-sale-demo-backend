import { Injectable } from "@nestjs/common";
import { IDataBuy, IPurchaseResponse } from "src/lib/models/data";
import { DtoBuy } from "src/lib/models/dto";
import { IResponse } from "src/lib/models/interface";
import { DBService } from "./db.service";

@Injectable()
export class BuyService {
  constructor(private db: DBService) {}
  Create = async (payload: DtoBuy): Promise<IResponse<IPurchaseResponse>> => {
    const data: IDataBuy = {
      promoId: payload.promoId,
      productId: payload.productId,
      email: payload.email,
      price: payload.price,
      quantity: payload.quantity,
    };
    console.log({ data });
    return {
      code: "Failed",
      message: "Failed",
    };
  };
  Process = async (payload: IDataBuy): Promise<void> => {
    console.log({ payload });
  };
}
