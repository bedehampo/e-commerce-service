import { object, string, number, array, TypeOf } from "zod";

const payload = {
  body: object({
    phoneNumber: string({
      required_error: "Phone number is required",
    }),
    password: string({
      required_error: "Password is required",
    }),
  }),
};

export const LoginSchema = object({
  ...payload,
});

export type CreateLoginInput = TypeOf<typeof LoginSchema>;
