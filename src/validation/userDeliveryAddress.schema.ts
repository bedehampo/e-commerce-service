import {
	object,
	string,
	number,
	array,
	TypeOf,
	boolean,
	any,
} from "zod";

const createPayload = {
	body: object({
		receiversName: string({
			required_error: "receiver's name is required",
			invalid_type_error:
				"receiver's name must be a string",
		}),
		receiversPhoneNumber: string({
			required_error: "receiver's phone number is required",
			invalid_type_error:
				"receiver's phone number must be a string",
		}),
		additionalPhoneNumber: string({
			invalid_type_error:
				"additional phone number must be a string",
		}).optional(),
		deliveryAddress: string({
			required_error: "delivery address is required",
			invalid_type_error:
				"delivery address must be a string",
		}),
		latitude: number({
			required_error: "latitude is required",
			invalid_type_error: "latitude must be a number",
		}),
		longitude: number({
			required_error: "longitude is required",
			invalid_type_error: "longitude must be a number",
		}),
		state: string({
			required_error: "state is required",
			invalid_type_error: "state must be a string",
		}),
		lga: string({
			required_error: "lga is required mow",
			invalid_type_error: "lga must be a string",
		}),
		setAsDefault: boolean({
			invalid_type_error:
				"set as default must be a boolean",
		}).optional(),
	}),
};

export const CreateUserDeliveryAddress = object({
	...createPayload,
});

export type CreateUserDeliveryAddressInput = TypeOf<
	typeof CreateUserDeliveryAddress
>;
