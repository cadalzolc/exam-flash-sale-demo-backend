import { IPurchaseOrder } from "./idata.purchase";

export interface IJobPurchase extends IPurchaseOrder {
  purchaseId: number;
  transNo: string;
  transDate: Date;
  product: string;
}
