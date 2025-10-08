export interface IPurchase {
  promoId?: number;
  productId: number;
  email: string;
  quantity: number;
  price: number;
  total: number;
}

export interface IPurchaseResponse {
  transNo: string;
  transDate: string;
  product: string;
  customer: string;
  total: number;
}
