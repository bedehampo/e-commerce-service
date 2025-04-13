import {
	array,
	object,
	string,
	number,
	TypeOf,
	z,
} from "zod";

const payload = {
	body: object({
		product: string({
			required_error: "Product is required",
		}),
		colorId: string({
			invalid_type_error: "selectedColorImage is required",
		}),
		quantity: number({
			invalid_type_error: "quantity is must be a number",
			required_error: "quantity is required",
		}),
		selected_variations: array(
			object({
				name: string({
					invalid_type_error: "name must be a string",
				}),
				value: string({
					invalid_type_error: "value must be a string",
				}),
			})
		).optional(),
	}),
};

const updateCartQuantity = {
	body: object({
		action: z.enum(["increment", "decrement"], {
			required_error: "Action is required",
			invalid_type_error:
				"Action must be either 'increment' or 'decrement'",
		}),
	}),
};

const params = {
	params: object({
		cartItemId: string({
			required_error: "productId is required",
		}),
	}),
	query: object({
		type: z.enum(["all", "one"], {
			required_error: "type is required",
		}),
	}),
};

export const AddToCartSchema = object({
	...payload,
});

export const UpdateCartQuantitySchema = object({
	...updateCartQuantity,
});

export type UpdateCartQuantityInput = TypeOf<
	typeof UpdateCartQuantitySchema
>;

export const RemoveFromCartSchema = object({
	...params,
});

export type AddToCartInput = TypeOf<typeof AddToCartSchema>;

export type RemoveFromCartInput = TypeOf<
	typeof RemoveFromCartSchema
>;

const ComputeSelectedCartTotalsPayload = {
	body: object({
		cartItemIds: array(
			string({
				invalid_type_error:
					"array item cartItemId must be a string",
			}),
			{
				required_error:
					"cartItemIds arrays field is required",
			}
		),
	}),
};

export const ComputeSelectedCartTotalsSchema = object({
	...ComputeSelectedCartTotalsPayload,
});

export type ComputeSelectedCartTotalsInput = TypeOf<
	typeof ComputeSelectedCartTotalsSchema
>;
