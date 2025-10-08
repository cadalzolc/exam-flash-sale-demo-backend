import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { QUEUES_PURCHASE } from "src/lib/common";
import { IConfigRedis } from "src/lib/models/interface";
import { QueueService } from "../services/queue.service";
import { PurchaseWorker } from "../worker/purchase.consumer";

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (cs: ConfigService) => {
        const cn = cs.get<IConfigRedis>("redis");

        return {
          connection: {
            host: cn?.host,
            port: cn?.port,
            username: cn?.user,
            password: cn?.pass,
          },
        };
      },
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: QUEUES_PURCHASE,
    }),
  ],
  providers: [QueueService, PurchaseWorker],
  exports: [QueueService],
})
export class QueueModule {}
