import { Module } from "@nestjs/common";
import { BuyController } from "../controller/buy.controller";
import { BuyService } from "../services/buy.service";
import { QueueModule } from "./queue.module";

@Module({
  imports: [QueueModule],
  controllers: [BuyController],
  providers: [BuyService],
  exports: [BuyService],
})
export class BuyModule {}
