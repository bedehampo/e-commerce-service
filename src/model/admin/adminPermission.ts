import mongoose, { Schema } from "mongoose";

const AdminPermissionSchema = new Schema(
	{
		name: { type: String, required: true, unique: true },
	},
	{
		timestamps: true,
		collection: "adminpermissions",
	}
);

export const AdminPermission = mongoose.model(
	"adminpermission",
	AdminPermissionSchema
);
