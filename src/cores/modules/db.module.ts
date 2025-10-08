import { Global, Module } from "@nestjs/common";
import { DBService } from "../services/db.service";

@Global()
@Module({
  providers: [DBService],
  exports: [DBService],
})
export class DBModule {}
