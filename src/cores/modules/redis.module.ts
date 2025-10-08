import { Global, Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { Redis } from "ioredis";
import { IConfigRedis } from "src/lib/models/interface";
import { RedisService } from "../services/redis.service";

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: "REDIS_CLIENT",
      useFactory: (configService: ConfigService): Redis => {
        const cn = configService.get<IConfigRedis>("redis");
        return new Redis({
          host: cn?.host,
          port: cn?.port,
          username: cn?.user,
          password: cn?.pass,
          lazyConnect: true,
          maxRetriesPerRequest: null,
          enableReadyCheck: false,
        });
      },
      inject: [ConfigService],
    },
    RedisService,
  ],
  exports: ["REDIS_CLIENT", RedisService],
})
export class RedisModule {}
