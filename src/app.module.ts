import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { AppController } from "./app.controller";

import { DBModule } from "./cores/modules/db.module";
import { PromoModule } from "./cores/modules/promo.module";
import { PurchaseModule } from "./cores/modules/purchase.module";
import { QueueModule } from "./cores/modules/queue.module";
import { RedisModule } from "./cores/modules/redis.module";
import { SocketModule } from "./cores/modules/socket.module";
import { EnvConfig } from "./lib/common";

@Module({
  imports: [
    ConfigModule.forRoot({ cache: true, isGlobal: true, load: [EnvConfig] }),
    RedisModule,
    SocketModule,
    DBModule,
    QueueModule,
    PurchaseModule,
    PromoModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
