import { Module } from "@nestjs/common";
import { BuyController } from "../controller/buy.controller";
import { BuyService } from "../services/buy.service";

@Module({
  imports: [],
  controllers: [BuyController],
  providers: [BuyService],
  exports: [BuyService],
})
export class BuyModule {}
