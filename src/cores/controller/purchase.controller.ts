import { Body, Controller, Post } from "@nestjs/common";
import { DtoPurchaseOrder } from "src/lib/models/dto";
import { PurchaseService } from "../services/purchase.service";

@Controller("purchase")
export class PurchaseController {
  constructor(private readonly svcOrder: PurchaseService) {}

  @Post()
  Create(@Body() payload: DtoPurchaseOrder) {
    return this.svcOrder.Create(payload);
  }
}
