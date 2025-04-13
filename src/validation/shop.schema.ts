import {
	object,
	string,
	number,
	array,
	TypeOf,
	boolean,
	z,
} from "zod";
const updateShopLocationPayload = {
	body: object({
		latitude: number({
			required_error: "Latitude is required",
			invalid_type_error: "Latitude must be a number",
		}),
		longitude: number({
			required_error: "Longitude is required",
			invalid_type_error: "Longitude must be a number",
		}),
	}),
};

export const UpdateShopLocationSchema = object({
	...updateShopLocationPayload,
});

export type UpdateShopLocationInput = TypeOf<
	typeof UpdateShopLocationSchema
>;

const payload = {
	body: object({
		logoImageUrl: string({
			required_error: "shop logo url is required",
			invalid_type_error: "shop logo url must be a string",
		}),
		category: string({
			required_error: "Category is required",
			invalid_type_error: "category must be a string",
		}),
		brand_name: string({
			required_error: "Brand name  is required",
			invalid_type_error: "brand name must be a string",
		}),
		official_email: string({
			invalid_type_error: "email must be a string",
		}).optional(),
		description: string({
			required_error: "Description is required",
			invalid_type_error: "description must be a string",
		}),
		official_phone_number: string({
			required_error: "Official phone number is required",
			invalid_type_error: "phone number must be a string",
		}),
		latitude: string({
			required_error: "Latitude is required",
			invalid_type_error: "Latitude must be a number",
		}),
		longitude: string({
			required_error: "Longitude is required",
			invalid_type_error: "Longitude must be a number",
		}),
		address: string({
			invalid_type_error: "address must be a string",
		}).optional(),
		state: string({
			required_error: "State is required",
			invalid_type_error: "state must be a string",
		}),
		lga: string({
			invalid_type_error: "LGA must be a string",
			required_error: "lga is required",
		}),
		landMark: string({
			invalid_type_error: "LandMark must be a string",
		}).optional(),
	}),
	// .refine((data) => {
	// 	//if order type is self pickup then deliveryDateTime is required
	// 	if (Number(data.latitude)) {
	// 		return true;
	// 	}
	// 	return false;
	// }, "Latitude must be a valid number")
	// .refine((data) => {
	// 	//if order type is self pickup then deliveryDateTime is required
	// 	if (Number(data.longitude)) {
	// 		return true;
	// 	}
	// 	return false;
	// }, "Longitude must be a valid number"),
};

export const CreateShopSchema = object({
	...payload,
});

export type CreateShopInput = TypeOf<
	typeof CreateShopSchema
>;

const updatePayload = {
	body: object({
		logoImageUrl: string().optional(),
		brand_name: string().optional(),
		official_email: string().optional(),
		description: string().optional(),
		official_phone_number: string().optional(),
		emailOn: boolean().optional(),
		pushNotifications: boolean().optional(),
		commentsOn: boolean().optional(),
		state: string().optional(),
		lga: string().optional(),
		latitude: number().optional(),
		longitude: number().optional(),
		address: string().optional(),
		landMark: string().optional(),
	}).optional(),
};

export const UpdateShopSchema = object({
	...updatePayload,
});

export type UpdateShopInput = TypeOf<
	typeof UpdateShopSchema
>;

const filterShopPayload = {
	body: object({
		name: string().optional(),
		category: string().optional(),
		location: object({
			// type: string().optional(),
			// coordinates: array(number()).optional(),
			latitude: number({
				required_error: "Latitude is required",
			}),
			longitude: number({
				required_error: "Longitude is required",
			}),
		}).optional(),
	}),
};

export const FilterShopSchema = object({
	...filterShopPayload,
});

export type FilterShopInput = TypeOf<
	typeof FilterShopSchema
>;

const addDeliveryMerchantPayload = {
	body: object({
		name: string({
			required_error: "Name is required",
		}),
		email: string({
			required_error: "Email is required",
		}),
	}),
};

export const AddDeliveryMerchantSchema = object({
	...addDeliveryMerchantPayload,
});

export type AddDeliveryMerchantInput = TypeOf<
	typeof AddDeliveryMerchantSchema
>;

const adjustPricePayload = {
	body: object({
		percentage: number({
			required_error: "Percentage is required",
			invalid_type_error: "Percentage must be a number",
		}),
		type: z.enum(["discount", "non_discount", "all"], {
			required_error: "Type is required",
		}),
	}),
};

export const AdjustPriceSchema = object({
	...adjustPricePayload,
});

export type AdjustPriceInput = TypeOf<
	typeof AdjustPriceSchema
>;

const updateShopNamePayload = {
	body: object({
		newShopName: string({
			required_error: "new shop name is required",
			invalid_type_error: "new shop name must be a string",
		}),
	}),
};

export const UpdateShopNameSchema = object({
	...updateShopNamePayload,
});

export type UpdateShopNameInput = TypeOf<
	typeof UpdateShopNameSchema
>;

const updateShopDescPayload = {
	body: object({
		newDescription: string({
			required_error: "new shop Desc is required",
			invalid_type_error: "new shop Desc must be a string",
		}),
	}),
};

export const UpdateShopDescSchema = object({
	...updateShopDescPayload,
});

export type UpdateShopDescInput = TypeOf<
	typeof UpdateShopDescSchema
>;

const updateShopContactInfoPayload = {
	body: object({
		phone: string({
			required_error: "shop phone number is required",
			invalid_type_error:
				"shop phone number must be a string",
		}),
		email: string({
			required_error: "shop email is required",
			invalid_type_error: "shop email must be a string",
		}),
		address: string({
			required_error: "shop address is required",
			invalid_type_error: "shop address must be a string",
		}),
	}),
};

export const UpdateShopContactInfoSchema = object({
	...updateShopContactInfoPayload,
});

export type UpdateShopContactInfoInput = TypeOf<
	typeof UpdateShopContactInfoSchema
>;

export const approveShopPayload = {
	params: object({
		shopId: string({
			invalid_type_error: "Shop must be a string",
			required_error: "Shop name is required",
		}),
	}),
};

export const approveShopSchema = object({
	...approveShopPayload,
});

export type ApproveShopInput = TypeOf<
	typeof approveShopSchema
>;

export const declineShopPayload = {
	body: object({
		description: string({
			invalid_type_error:
				"Shop description must be a string",
			required_error: "Shop description is required",
		}),
	}),
	params: object({
		shopId: string({
			invalid_type_error: "Shop must be a string",
			required_error: "Shop Id is required",
		}),
	}),
};

export const declineShopSchema = object({
	...declineShopPayload,
});

export type DeclineShopInput = TypeOf<
	typeof declineShopSchema
>;

export const reactivateShopPayload = {
	params: object({
		shopId: string({
			invalid_type_error: "Shop must be a string",
			required_error: "Shop name is required",
		}),
	}),
};

export const reactivateShopSchema = object({
	...reactivateShopPayload,
});

export type ReactivateShopInput = TypeOf<
	typeof reactivateShopSchema
>;

export const suspendShopPayload = {
	params: object({
		shopId: string({
			invalid_type_error: "Shop must be a string",
			required_error: "Shop name is required",
		}),
	}),
	body: object({
		reason: string({
			invalid_type_error: "Reason must be a string",
			required_error: "Reason is required, path: reason",
		}),
	}),
};

export const suspendShopSchema = object({
	...suspendShopPayload,
});

export type SuspendShopInput = TypeOf<
	typeof suspendShopSchema
>;

// Admin Shop Notification
export const sendShopsNotificationAdmin = {
	body: object({
		subject: string({
			required_error: "Notification message is required",
			invalid_type_error:
				"Notification message must be a string",
		}),
		message: string({
			required_error: "Notification message is required",
			invalid_type_error:
				"Notification message must be a string",
		}),
	}),
};

export const sendShopsNotificationAdminSchema = object({
	...sendShopsNotificationAdmin,
});

export type sendShopsNotificationAdminInput = TypeOf<
	typeof sendShopsNotificationAdminSchema
>;

export const sendShopInvite = {
	body: object({
		inviteeIds: array(
			number({
				required_error: "inviteIds (user ids) are required",
				invalid_type_error:
					"inviteIds (user ids) must be a number",
			})
		),
		transactionPin: number({
			required_error: "transaction pin is required",
			invalid_type_error:
				"transaction pin must be a number",
		}),
		permissions: array(
			string({
				required_error: "permissions are required",
				invalid_type_error: "permissions must be a string",
			})
		),
	}),
};

export const sendShopInviteSchema = object({
	...sendShopInvite,
});

export type sendShopInviteInput = TypeOf<
	typeof sendShopInviteSchema
>;

export const shopBgPayload = {
	body: object({
		backgroundImageUrl: string({
			required_error: "image url is required",
			invalid_type_error: "image url must be a string",
		}),
		shopId: string({
			required_error: "shop id is required",
			invalid_type_error: "Shop id must be a string",
		}),
	}),
};

export const shopBgSchema = object({
	...shopBgPayload,
});

export type shopBgInput = TypeOf<typeof shopBgSchema>;

export const shopDPPayload = {
	body: object({
		logoImageUrl: string({
			required_error: "image url is required",
			invalid_type_error: "image url must be a string",
		}),
		shopId: string({
			required_error: "shop id is required",
			invalid_type_error: "Shop id must be a string",
		}),
	}),
};

export const shopDPSchema = object({
	...shopDPPayload,
});

export type shopDPInput = TypeOf<typeof shopDPSchema>;

export const amountSuggest = {
	body: object({
		beneficiaryAccount: string({
			required_error: "beneficiaryAccount is required",
			invalid_type_error:
				"beneficiaryAccount must be a string",
		}),
	}),
};

export const amountSuggestSchema = object({
	...amountSuggest,
});

export type amountSuggestInput = TypeOf<
	typeof amountSuggestSchema
>;
