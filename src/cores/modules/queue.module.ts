import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import Redis from "ioredis";
import { QUEUES_PURCHASE } from "src/lib/common";
import { PurchaseConsumer } from "../consumer/purchase.consumer";
import { PurchaseQueue } from "../queues/purchase.queue";
import { QueueService } from "../services/queue.service";
import { RedisModule } from "./redis.module";
import { SocketModule } from "./socket.module";

@Module({
  imports: [
    RedisModule,
    SocketModule,
    BullModule.forRootAsync({
      imports: [ConfigModule, RedisModule],
      useFactory: (redis: Redis) => {
        return {
          connection: redis,
        };
      },
      inject: ["REDIS_CLIENT"],
    }),
    BullModule.registerQueue({
      name: QUEUES_PURCHASE,
    }),
  ],
  providers: [QueueService, PurchaseQueue, PurchaseConsumer],
  exports: [QueueService, PurchaseConsumer],
})
export class QueueModule {}
