import { Module } from "@nestjs/common";
import { PromoController } from "../controller/promo.controller";
import { PromoService } from "../services/promo.service";

@Module({
  imports: [],
  controllers: [PromoController],
  providers: [PromoService],
  exports: [PromoService],
})
export class PromoModule {}
