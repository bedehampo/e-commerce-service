import { string, object, TypeOf, array } from "zod";

const payload = {
	body: object({
		permissionCode: string({
			required_error: "Permission code is required",
		}),
		permissionDescription: string({
			required_error: "Permission Description is required",
		}),
	}),
};

export const CreateShopPermissionSchema = object({
	...payload,
});

export type CreateShopPermissionInput = TypeOf<
	typeof CreateShopPermissionSchema
>;

const sendShopInvite = {
	body: object({
		userId: string({
			required_error: "User Id is required",
			invalid_type_error: "User Id must be a string",
		}),
		permissions: array(
			string({
				invalid_type_error: "Permission must be a string",
			})
		),
	}),
};

export const SendShopInviteSchema = object({
	...sendShopInvite,
});

export type SendShopInviteInput = TypeOf<
	typeof SendShopInviteSchema
>;
