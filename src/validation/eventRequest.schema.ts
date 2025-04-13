import { object, string, number, array, TypeOf, z } from "zod";

const payload = {
  body: object({
    name: string({
      required_error: "The ticket holder's name is required",
    }),
    email: string({
      required_error: "Email is required",
    }),
    phone_number: string({
      required_error: "Phone number is required",
    }),
    no_of_tickets: number({
      required_error: "The number of tickets is required",
    }),
    category: z.enum(["regular", "vip", "table_for_five", "table_for_ten"]),
    event: string({
      required_error: "The event id is required",
    }),
  }),
};

export const CreateEventRequestSchema = object({
  ...payload,
});

export type CreateEventRequestInput = TypeOf<typeof CreateEventRequestSchema>;
