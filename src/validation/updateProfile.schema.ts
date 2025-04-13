import { object, string, z } from "zod";

const updateProfilePayload = {
  body: object({
    bio: string()
      .optional()
      .refine(
        (value) => {
          if (typeof value === "undefined") return true;
          return value.length > 0;
        },
        {
          message: "bio is required",
        }
      ),
    profilePictureUrl: string()
      .optional()
      .refine(
        (value) => {
          if (typeof value === "undefined") return true;
          return value.length > 0;
        },
        {
          message: "profilePictureUrl is required",
        }
      ),
  }),
};

export const updateProfileSchema = object({
  ...updateProfilePayload,
});
