import { Controller, Get, Render } from "@nestjs/common";
import { GetCurrentStamp } from "./lib/common";

@Controller()
export class AppController {
  constructor() {}

  @Get()
  @Render("index")
  root() {
    return {
      lang: "en",
      stamp: GetCurrentStamp(),
      icon: `${process.env.APP_URL ?? ""}/favicon.ico`,
      version: process.env.APP_VERSION,
    };
  }
}
