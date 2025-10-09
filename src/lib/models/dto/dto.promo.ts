import { IsNotEmpty, IsNumber } from "class-validator";

export class DtoPromoId {
  @IsNumber({}, { message: "Must be a number" })
  @IsNotEmpty({ message: "Required" })
  promoId!: number;
}
