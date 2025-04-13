import { IUser } from "./user";

export interface IDeal<T> {
  id: number;
  userId: T;
  productName: string;
  quantity: number;
  price: number;
  marketPrice: number;
  discount: number;
  state: string;
  address: string;
  lga: string;
  description: string;
  status: string;
  requests: number[];
  location: IGeoJson;
}

export interface IGeoJson {
  type: string;
  coordinates: number[];
}