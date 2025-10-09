export interface IProduct {
  id: number;
  promoId: number;
  name: string;
  description: string;
  stock: number;
  sold: number;
  url?: string;
  price: number;
}
