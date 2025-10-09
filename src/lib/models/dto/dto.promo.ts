import { Type } from "class-transformer";
import { IsDate, IsNotEmpty } from "class-validator";

export class DtoPromoPeriod {
  @Type(() => Date)
  @IsDate({ message: "Must be a Date" })
  @IsNotEmpty({ message: "Required" })
  dateStart!: Date;

  @Type(() => Date)
  @IsDate({ message: "Must be a Date" })
  @IsNotEmpty({ message: "Required" })
  dateEnd!: Date;
}
