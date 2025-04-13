import {
  coerce,
  date,
  number,
  object,
  string,
  boolean,
  TypeOf,
  z,
  array,
} from "zod";

const addPlatformConfigPayload = {
  body: object({
    key: string({
      required_error: "Key is required",
      invalid_type_error: "Key must be a string",
    }),
    value: string({
      invalid_type_error: "Value must be a string",
    }).optional(),
    valueType: z.enum(["single", "array"], {
      invalid_type_error: "Value type must be one of 'single' or 'array'",
      required_error: "Value type is required",
    }),
    description: string({
      invalid_type_error: "Description must be a string",
    }).optional(),
    values: array(string()).optional(),
  }),
};

export const AddPlatformConfigSchema = object({
  ...addPlatformConfigPayload,
});

export type AddPlatformConfigInput = TypeOf<typeof AddPlatformConfigSchema>;


const updatePlatformConfigPayload = {
  body: object({
    key: string({
      invalid_type_error: "Key must be a string",
    }).optional(),
    value: string({
      invalid_type_error: "Value must be a string",
    }).optional(),
    valueType: z.enum(["single", "array"], {
      invalid_type_error: "Value type must be one of 'single' or 'array'",
    }).optional(),
    description: string({
      invalid_type_error: "Description must be a string",
    }).optional(),
    values: array(string()).optional(),
  }),
};

export const UpdatePlatformConfigSchema = object({
  ...updatePlatformConfigPayload,
});

export type UpdatePlatformConfigInput = TypeOf<typeof UpdatePlatformConfigSchema>;