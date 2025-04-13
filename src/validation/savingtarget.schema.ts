import {
	object,
	string,
	number,
	array,
	TypeOf,
	optional,
	z,
	date,
	boolean,
} from "zod";

const createPayload = {
	body: object({
		title: string({
			required_error: "Title is required",
			invalid_type_error: "title must be a string",
		}),
		targetAmount: number({
			required_error: "Amount is required",
			invalid_type_error: "Amount must be a number",
		}),
		startDate: date({
			required_error: "Start date is required",
			invalid_type_error: "Start date must be a date",
		}),
		dueDate: date({
			required_error: "Due date is required",
			invalid_type_error: "Due date must be a date",
		}),
		reminderDate: date({
			required_error: "Reminder date is required",
			invalid_type_error: "Reminder date must be date",
		}),
		category: string({
			required_error: "category is required",
			invalid_type_error: "category must be string",
		}),
		frequency: string({
			required_error: "frequency is required",
			invalid_type_error: "frequency must be a string",
		}),
		setBudget: number({
			required_error: "set budget is required",
			invalid_type_error: "set budget must be a number",
		}),
		automateSaving: boolean({
			required_error: "automate saving is required",
			invalid_type_error:
				"automate saving must be a boolean",
		}),
		balance: number({
			required_error: "automate saving is required",
			invalid_type_error:
				"automate saving must be a number",
		}),
	}),
};

export const CreateSavingTargetSchema = object({
	...createPayload,
});

export type CreateSavingTargetInput = TypeOf<
	typeof CreateSavingTargetSchema
>;
