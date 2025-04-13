import { object, string, number, TypeOf, z } from "zod";

const payload = {
  params: object({
    search: string().optional(),
    category: string().optional(),
    sub_category: string().optional(),
    min_price: number().optional(),
    max_price: number().optional(),
    brand: string().optional(),
  }),
};

export const filterProductSchema = object({
  ...payload,
});

export type FilterProductInput = TypeOf<typeof filterProductSchema>;
