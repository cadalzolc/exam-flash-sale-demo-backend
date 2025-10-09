import { Body, Controller, Param, ParseIntPipe, Post } from "@nestjs/common";
import { DtoPromoPeriod } from "src/lib/models/dto";
import { PromoService } from "../services/promo.service";

@Controller("promo")
export class PromoController {
  constructor(private readonly services: PromoService) {}

  @Post(":id/reset")
  Create(
    @Param("id", ParseIntPipe) id: number,
    @Body() payload: DtoPromoPeriod,
  ) {
    return this.services.Reset({
      promoId: id,
      dateStart: payload.dateStart,
      dateEnd: payload.dateEnd,
    });
  }
}
