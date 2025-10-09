export interface IProduct {
  id: number;
  promoId?: number;
  name: string;
  description: string;
  stock: number;
  url?: string;
  price: number;
}
