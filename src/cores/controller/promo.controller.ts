import { Controller, Param, ParseIntPipe, Post } from "@nestjs/common";
import { PromoService } from "../services/promo.service";

@Controller("promo")
export class PromoController {
  constructor(private readonly services: PromoService) {}

  @Post(":id/reset")
  Create(@Param("id", ParseIntPipe) id: number) {
    return this.services.Reset(id);
  }
}
