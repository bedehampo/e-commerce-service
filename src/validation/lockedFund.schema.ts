import { object, string, number, array, TypeOf, optional, z } from "zod";

const payload = {
  body: object({
    title: string({
      required_error: "Title is required",
    }),
    amount: number({
      required_error: "Amount is required",
    }),
    dueDate: string({
      required_error: "Due date is required",
    }),
    startDate: string({
      required_error: "Start date is required",
    }),
  }),
};

export const withdrawAndCreateLockedFundSchema = object({
  ...payload,
});

export type CreateEventInput = TypeOf<typeof withdrawAndCreateLockedFundSchema>;
