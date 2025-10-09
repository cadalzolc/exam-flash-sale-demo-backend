import { IProduct } from "./idata.product";

export interface IPromo {
  id: number;
  name: string;
  dateStart: string;
  dateEnd: string;
  mode: string;
}

export interface IPromoProduct {
  id: number;
  promoId: number;
  promo: IPromo;
  productId: number;
  product: IProduct;
  stock: number;
  price: number;
  sold: number;
}

export interface IPromoPeriod {
  promoId: number;
  dateStart: Date;
  dateEnd: Date;
}
