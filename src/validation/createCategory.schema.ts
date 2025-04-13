import {
	object,
	string,
	number,
	array,
	TypeOf,
	optional,
	z,
} from "zod";

const payload = {
	body: object({
		categoryName: string({
			required_error: "Category Title is required",
		}),
		icon: string({
			required_error: "Category icon is required",
		}),
		image: string({
			required_error: "Category image is required",
		}),
		subCategories: array(
			string().min(0, "Select at least one subcategory")
		),
	}),
};

export const CreateCategorySchema = object({
	...payload,
});

export type CreateCategoryInput = TypeOf<
	typeof CreateCategorySchema
>;

const editPayload = {
	body: object({
		categoryName: string({
			required_error: "Category Title is required",
		}).optional(),
		icon: string({
			required_error: "Category icon is required",
		}).optional(),
		image: string({
			required_error: "Category image is required",
		}).optional(),
	}),
};

export const EditCategorySchema = object({
	...editPayload,
});

export type EditCategoryInput = TypeOf<
	typeof EditCategorySchema
>;

const subPayload = {
	body: object({
		categoryId: string({
			required_error:
				"Sub category can't exist without a category",
		}),
		names: array(
			string().min(1, "Input at least one sub category")
		),
	}),
};

export const CreateSubCategorySchema = object({
	...subPayload,
});

export type CreateSubCategoryInput = TypeOf<
	typeof CreateSubCategorySchema
>;

const variationPayload = {
	body: object({
		name: string({
			required_error: "Variation is required",
		}),
		values: array(string()),
	}),
};

export const CreateVariationSchema = object({
	...variationPayload,
});

export type CreateVariationInput = TypeOf<
	typeof CreateVariationSchema
>;

const productPropertyPayload = {
	body: object({
		properties: array(
			object({
				name: string({
					required_error: "Property name is required",
					invalid_type_error:
						"Property name must be a string",
				}),
				value: array(string()).optional(),
			})
		).min(1, "At least one property is required"),
		subCategoryIds: array(string())
			.min(1, "Input at least one sub-category id")
			.nonempty("At least one sub-category id is required"),
	}),
};

export const CreateProductPropertySchema = object({
	...productPropertyPayload,
});

export type CreateProductPropertyInput = TypeOf<
	typeof CreateProductPropertySchema
>;

const vendorEnquiryPayload = {
	body: object({
		enquiryGroupName: string({
			required_error: "enquiry group name is required",
			invalid_type_error:
				"enquiry group name must be a string",
		}),
		enquiryGroupTypes: array(
			object({
				enquiryType: string({
					required_error: "enquiry type name is required",
					invalid_type_error:
						"enquiry type name must be a string",
				}),
				reasons: array(
					string({
						required_error: "enquiry reasons is required",
						invalid_type_error:
							"enquiry reasons must be a string",
					})
				),
			})
		),
	}),
};

export const VendorEnquirySchema = object({
	...vendorEnquiryPayload,
});

export type VendorEnquiryInput = TypeOf<
	typeof VendorEnquirySchema
>;

const sendEnquiryPayload = {
	body: object({
		email: string({
			invalid_type_error: "email must be a string",
		}).optional(),
		enquiryTypeId: string({
			required_error: "enquiry type is required",
			invalid_type_error: "enquiry type must be a string",
		}),
		reasonId: string({
			invalid_type_error: "reason id must be a string",
		}).optional(),
		documents: array(
			string({
				invalid_type_error: "documents must be a string",
			})
		).optional(),
		description: string({
			invalid_type_error: "description must be a string",
		}).optional(),
		sku: string({
			invalid_type_error: "sku must be a string",
		}).optional(),
		orderId: string({
			invalid_type_error: "orderId must be a string",
		}).optional(),
	}),
};

export const SendEnquirySchema = object({
	...sendEnquiryPayload,
});

export type SendEnquiryInput = TypeOf<
	typeof SendEnquirySchema
>;

const createFaqGroup = {
	body: object({
		name: string({
			required_error: "FAQ Group Name is required",
			invalid_type_error: "FAQ Group Name must be a string",
		}),
	}),
};

export const CreateFaqGroupSchema = object({
	...createFaqGroup,
});

export type CreateFaqGroupInput = TypeOf<
	typeof CreateFaqGroupSchema
>;

const createFaq = {
	body: object({
		faqs: array(
			object({
				question: string({
					required_error: "FAQ Question is required",
					invalid_type_error:
						"FAQ Question must be a string",
				}),
				answer: string({
					required_error: "FAQ Answer is required",
					invalid_type_error: "FAQ Answer must be a string",
				}),
			})
		),
	}),
};

export const CreateFaqSchema = object({
	...createFaq,
});

export type CreateFaqInput = TypeOf<typeof CreateFaqSchema>;
