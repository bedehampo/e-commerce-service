import { TypeOf, object, string, z } from "zod";

const GenderEnum = z.enum(["male", "female"]);

const payload = {
  body: object({
    firstName: string({
      required_error: "First name is required",
    }),
    lastName: string({
      required_error: "Last name is required",
    }),
    gender: string({
      required_error: "Gender is required",
    }).refine((value) => GenderEnum.safeParse(value).success, {
      message: "Invalid gender value",
    }),
    phoneNumber: string({
      required_error: "Phone number is required",
    }),
    password: string({
      required_error: "Password is required",
    })
      .min(6, "Password must be at least 6 characters")
      // .regex(
      //   /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/,
      //   "Password must contain atleast one uppercase character, one lowercase character, one number and one special character"
      // ),
  }),
};

export const RegisterSchema = object({
  ...payload,
});

export type RegisterInput = TypeOf<typeof RegisterSchema>;
