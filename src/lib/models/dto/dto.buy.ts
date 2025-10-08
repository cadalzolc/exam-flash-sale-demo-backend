import { IsEmail, IsNotEmpty, IsNumber, Min } from "class-validator";

export class DtoBuy {
  @IsNumber({}, { message: "Must be a number" })
  @IsNotEmpty({ message: "Required" })
  promoId!: number;

  @IsNumber({}, { message: "Must be a number" })
  @IsNotEmpty({ message: "Required" })
  productId!: number;

  @IsEmail({}, { message: "Invalid email format" })
  @IsNotEmpty({ message: "Required" })
  email!: string;

  @IsNumber({}, { message: "Must be a number" })
  @Min(0, { message: "Quantity cannot be negative" })
  quantity!: number;

  @IsNumber({}, { message: "Must be a number" })
  @Min(0, { message: "Price cannot be negative" })
  price!: number;
}
