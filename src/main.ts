import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";

import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";
import { RouteLogger, ValidationExceptionFactory } from "./lib/common";

async function bootstrap() {
  const port = process.env.APP_PORT || 3500;
  const appPrefix = process.env.APP_NAME || "Flash-Sales";
  const corsOrigin = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(" ").map((origin) => origin.trim())
    : [];

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
    cors: {
      origin: corsOrigin,
      credentials: true,
      allowedHeaders: ["Content-Type", "X-CADALZO"],
    },
    logger: new RouteLogger(appPrefix, {
      timestamp: false,
    }),
  });

  app.set("trust proxy", 1);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      stopAtFirstError: true,
      exceptionFactory: (err) => ValidationExceptionFactory(err),
    }),
  );

  await app.listen(port);
}

void bootstrap();
