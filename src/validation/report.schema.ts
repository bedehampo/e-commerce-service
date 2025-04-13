import { object, string, array, TypeOf } from "zod";

const createShopReportPayload = {
	body: object({
		complaint: string({
			required_error: "Complaint is required",
			invalid_type_error: "Complaint must be a string",
		}),
		reasons: array(
			string({
				invalid_type_error: "Reason must be a string",
			}).optional()
		),
	}),
};

export const CreateShopReportSchema = object({
	...createShopReportPayload,
});

export type CreateShopReportInput = TypeOf<
	typeof CreateShopReportSchema
>;

const updateShopReportPayload = {
	body: object({
		complaint: string({
			required_error: "Complaint is required",
			invalid_type_error: "Complaint must be a string",
		}),
		reasons: array(
			string({
				invalid_type_error: "Reason must be a string",
			}).optional()
		),
	}),
};

export const UpdateShopReportSchema = object({
	...updateShopReportPayload,
});

export type UpdateShopReportInput = TypeOf<
	typeof UpdateShopReportSchema
>;

const createUserReportPayload = {
	body: object({
		productId: string({
			required_error: "Product ID is required",
			invalid_type_error: "Product ID must be a string",
		}),
		complaint: string({
			required_error: "Complaint is required",
			invalid_type_error: "Complaint must be a string",
		}),
		complaintDescription: string({
			required_error: "Complaint description is required",
			invalid_type_error:
				"Complaint description must be a string",
		}),
		optionalDescription: string({
			invalid_type_error:
				"Optional description must be a string",
		}).optional(),
		reportType: string({
			required_error: "Report type is required",
			invalid_type_error: "Report type must be a string",
		}),
	}),
};

export const CreateUserReportSchema = object({
	...createUserReportPayload,
});

export type CreateUserReportInput = TypeOf<
	typeof CreateUserReportSchema
>;
