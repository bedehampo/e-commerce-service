import { StatusTypes } from "../utils/interfaces";

export interface Transaction {
  transactionRef: string;
  amount: number;
  description: string;
  transactionStatus: string;
  fee: number;
  customerUniqueIdentifier: null | string;
  customFieldName: null | string;
  provider: null | string;
  paymentItem: null | string;
  billsCategory: null | string;
  items: TransactionItem[];
}

interface TransactionItem {
  parentRef: string;
  accountNo: string;
  itemName: string;
  shopName: string;
  amount: number;
  quantity: number;
  fee: number;
}
export enum TransactionType {
  PURCHASE = "PURCHASE",
}

export interface TransactionServiceResponse<T> {
  code: TransactionStatusCode;
  description: string;
  status: string;
  data?: T;
}

export enum TransactionStatusCode {
  SUCCESSFUL = "00",
  BADREQUEST = "400",
}

