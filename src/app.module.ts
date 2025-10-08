import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { BuyModule } from "./cores/modules/buy.module";
import { DBModule } from "./cores/modules/db.module";
import { QueueModule } from "./cores/modules/queue.module";
import { SocketModule } from "./cores/modules/socket.module";
import { EnvConfig } from "./lib/common";

@Module({
  imports: [
    ConfigModule.forRoot({ cache: true, isGlobal: true, load: [EnvConfig] }),
    DBModule,
    QueueModule,
    SocketModule,
    BuyModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
