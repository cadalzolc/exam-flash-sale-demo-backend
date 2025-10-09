import { Module } from "@nestjs/common";

import { PurchaseController } from "../controller/purchase.controller";
import { PurchaseService } from "../services/purchase.service";
import { QueueModule } from "./queue.module";

@Module({
  imports: [QueueModule],
  controllers: [PurchaseController],
  providers: [PurchaseService],
  exports: [PurchaseService],
})
export class PurchaseModule {}
