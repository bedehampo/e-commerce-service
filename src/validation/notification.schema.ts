import { object, string, number, array, TypeOf, z } from "zod";

const payload = {
  body: object({
    title: string({
      required_error: "Title is required",
    }),
    description: string({
      required_error: "Description is required",
    }),
  }),
};

export const AddNotificationSchema = object({
  ...payload,
});

export type AddNotificationInput = TypeOf<typeof AddNotificationSchema>;
