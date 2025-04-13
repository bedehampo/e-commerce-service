import mongoose, { Schema } from "mongoose";

const OtpSchema = new Schema(
	{
		otp: {
			type: String,
			default: null,
		},
		expiresAt: {
			type: Date,
			required: true,
			default: () => new Date(Date.now() + 2 * 60 * 1000),
		},
	},
	{
		_id: false,
		timestamps: false,
	}
);

const AdminUserSchema = new mongoose.Schema(
	{
		tag: { type: String, default: "admin-user" },
		passport: { type: String, default: null },
		firstName: { type: String, default: "" },
		lastName: { type: String, default: "" },
		gender: {
			type: String,
			enum: ["male", "female"],
		},
		email: {
			type: String,
			default: "",
		},
		emailverified: { type: Boolean, default: false },
		password: { type: String, required: true },
		pin: { type: String, default: null },
		status: {
			type: String,
			enum: [
				"unverified",
				"verified",
				"suspended",
				"resigned",
				"sacked",
			],
			default: "unverified",
		},
		otp: { type: OtpSchema },
		adminRole: {
			type: Schema.Types.ObjectId,
			ref: "adminrole",
			default: null,
		},
	},
	{
		timestamps: true,
		collection: "adminusers",
	}
);

export const AdminUser = mongoose.model(
	"adminuser",
	AdminUserSchema
);
