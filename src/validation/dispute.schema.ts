import {
	object,
	string,
	number,
	array,
	TypeOf,
	boolean,
} from "zod";

const payload = {
	body: object({
		orderID: string({
			required_error: "Order id is required",
			invalid_type_error: "order id must be a string",
		}),
		type: string({
			required_error: "Dispute type id is required",
			invalid_type_error:
				"Dispute type id must be a string",
		}),
		description: string({
			invalid_type_error:
				"Dispute description must be a string",
		}).optional(),
		evidence: array(
			string({
				invalid_type_error: "Evidence must be a string",
			})
		).optional(),
		address: string({
			required_error: "Address is required",
			invalid_type_error: "Address must be a string",
		}),
	}),
};

export const DisputeSchema = object({
	...payload,
});

export type DisputeInput = TypeOf<typeof DisputeSchema>;

const rejectionPayload = {
	body: object({
		rejectionReason: string({
			required_error:
				"Dispute rejection reason is required",
			invalid_type_error:
				"Dispute rejection reason must be a string",
		}),
		rejectionDoc: array(
			string({
				invalid_type_error:
					"Rejection document must be a string",
			})
		).optional(),
	}),
};

export const RejectionReasonSchema = object({
	...rejectionPayload,
});

export type RejectionReasonInput = TypeOf<
	typeof RejectionReasonSchema
>;

const acceptPayload = {
	body: object({
		shopId: string({
			required_error: "shop id is required",
			invalid_type_error: "shop id must be a string",
		}),
		disputeId: string({
			required_error: "dispute id is required",
			invalid_type_error: "dispute id must be a string",
		}),
		vendorResponse: string({
			required_error: "vendor response is required",
			invalid_type_error:
				"vendor response must be a string",
		}),
	}),
};

export const AcceptDisputeSchema = object({
	...acceptPayload,
});

export type AcceptDisputeInput = TypeOf<
	typeof AcceptDisputeSchema
>;

const rejectPayload = {
	body: object({
		shopId: string({
			required_error: "shop id is required",
			invalid_type_error: "shop id must be a string",
		}),
		disputeId: string({
			required_error: "dispute id is required",
			invalid_type_error: "dispute id must be a string",
		}),
		vendorResponse: string({
			required_error: "vendor response is required",
			invalid_type_error:
				"vendor response must be a string",
		}),
	}),
};

export const RejectDisputeSchema = object({
	...rejectPayload,
});

export type RejectDisputeInput = TypeOf<
	typeof RejectDisputeSchema
>;

const disputeReasonPayload = {
	body: object({
		name: string({
			required_error: "Dispute reason name is required",
			invalid_type_error:
				"Dispute reason name must be a string",
		}),
		duration: number({
			required_error: "Dispute reason duration is required",
			invalid_type_error:
				"Dispute reason name must be a number",
		}),
	}),
};

export const DisputeReasonSchema = object({
	...disputeReasonPayload,
});

export type DisputeReasonInput = TypeOf<
	typeof DisputeReasonSchema
>;

const editDisputeReasonPayload = {
	body: object({
		id: string({
			required_error: "Dispute reason id is required",
			invalid_type_error:
				"Dispute reason id must be a string",
		}),
		name: string({
			required_error: "Dispute reason name is required",
			invalid_type_error:
				"Dispute reason name must be a string",
		}),
	}),
};

export const EditDisputeReasonSchema = object({
	...editDisputeReasonPayload,
});

export type EditDisputeReasonInput = TypeOf<
	typeof EditDisputeReasonSchema
>;
