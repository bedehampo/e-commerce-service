import { object, string, number, array, TypeOf } from "zod";

const payload = {
  body: object({
    bvn: string({
      required_error: "BVN is required",
    }).length(11, "BVN must be 11 digits"),
  }),
};

export const VerifyBvnSchema = object({
  ...payload,
});

export type CreateCarInput = TypeOf<typeof VerifyBvnSchema>;
