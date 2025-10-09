import { IsDate, IsNotEmpty } from "class-validator";

export class DtoPromoPeriod {
  @IsDate({ message: "Must be a Date" })
  @IsNotEmpty({ message: "Required" })
  dateStart!: Date;

  @IsDate({ message: "Must be a Date" })
  @IsNotEmpty({ message: "Required" })
  dateEnd!: Date;
}
