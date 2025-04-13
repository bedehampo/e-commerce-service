import mongoose, { Schema } from "mongoose";

const AdminRoleSchema = new Schema(
	{
		name: { type: String, required: true, unique: true },
		description: { type: String, required: true, unique: true },
		permissions: [
			{
				type: Schema.Types.ObjectId,
				ref: "adminpermission",
			},
		]
	},
	{
		timestamps: true,
		collection: "adminroles",
	}
);



export const AdminRole = mongoose.model(
	"adminrole",
	AdminRoleSchema
);
