import { Body, Controller, Post } from "@nestjs/common";
import { DtoBuy } from "src/lib/models/dto";
import { BuyService } from "../services/buy.service";

@Controller("buy")
export class BuyController {
  constructor(private readonly svcBuy: BuyService) {}

  @Post()
  Create(@Body() payload: DtoBuy) {
    return this.svcBuy.Create(payload);
  }
}
