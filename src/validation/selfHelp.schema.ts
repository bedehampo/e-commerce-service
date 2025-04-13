import { object, string, TypeOf } from "zod";

const payload = {
	body: object({
		problem: string({
			required_error: "problem is required",
			invalid_type_error: "problem must be a string",
		}),
		solution: string({
			required_error: "solution is required",
			invalid_type_error: "solution must be a string",
		}),
	}),
};

export const SelfHelpSchema = object({
	...payload,
});

export type SelfHelpInput = TypeOf<typeof SelfHelpSchema>;

const editPayload = {
	body: object({
		id: string({
			required_error: "id is required",
			invalid_type_error: "id must be a string",
		}),
		problem: string({
			required_error: "problem is required",
			invalid_type_error: "problem must be a string",
		}),
		solution: string({
			required_error: "solution is required",
			invalid_type_error: "solution must be a string",
		}),
	}),
};

export const EditSelfHelpSchema = object({
	...editPayload,
});

export type EditSelfHelpInput = TypeOf<typeof EditSelfHelpSchema>;