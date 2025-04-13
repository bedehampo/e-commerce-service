import { object, string, z } from "zod";

const statusEnum = z.enum(['published', 'stale']);

const createTermPayload = {
  body: object({
    heading: string({
      required_error: "heading is required",
    }),
    body: string({
      required_error: "body is required",
    }),
  }),
};

const editTermPayload = {
  body: object({
    heading: string().optional().refine(value => {
      if (typeof value === 'undefined') return true;
      return value.length > 0;
    }, {
      message: 'heading is required'  
    }),
    body: string().optional().refine(value => {
      if (typeof value === 'undefined') return true;
      return value.length > 0;
    }, {
      message: 'body is required'
    }),
    status: string().optional().refine((value) => {
      if (typeof value === 'undefined') return true;

      const result = statusEnum.safeParse(value);
      return result.success;
    }, {
      message: "Status can only be 'published' or 'stale'",
    }),
  })
}

export const CreateTermSchema = object({
  ...createTermPayload,
});

export const EditTermSchema = object({
  ...editTermPayload,
});
