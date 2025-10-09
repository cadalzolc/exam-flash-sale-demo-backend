export interface IPurchase {
  promoId?: number;
  productId: number;
  email: string;
  quantity: number;
  price: number;
  total: number;
}

export interface IPurchaseOrder {
  promoId: number;
  productId: number;
  email: string;
  quantity: number;
  price: number;
}

export interface IPurchaseResponse {
  transNo: string;
  transDate: Date;
  product: string;
  customer: string;
  amount: number;
}

export interface IOrderResponse {
  no: string;
  date: Date;
  amount: number;
}
