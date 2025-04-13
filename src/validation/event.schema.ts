import { object, string, number, array, TypeOf, optional, z } from "zod";

const payload = {
  body: object({
    title: string({
      required_error: "Title is required",
    }),
    pricePerTicket: number({
      required_error: "Price per ticket is required",
    }),
    description: string({
      required_error: "Description is required",
    }),
    number_of_tickets_available: number({
      required_error: "The number of tickets available is required",
    }),
    regularPrice: number().gt(0).optional(),
    vipPrice: number().optional(),
    tableForFivePrice: number().optional(),
    tableForTenPrice: number().optional(),
    // categories: array(
    //   z.enum(["regular", "vip", "table_for_five", "table_for_ten"])
    // ),
    discount: number().gt(0).lte(100).optional(),
    featured_artists: string().array().optional(),
  }),
};

export const CreateEventSchema = object({
  ...payload,
});

export type CreateEventInput = TypeOf<typeof CreateEventSchema>;
