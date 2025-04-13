import mongoose from "mongoose";

const Address = new mongoose.Schema(
	{
		receiversName: {
			type: String,
			required: true,
		},
		receiversPhoneNumber: {
			type: String,
			required: true,
		},
		additionalPhoneNumber: {
			type: String,
		},
		deliveryAddress: {
			type: String,
			required: true,
		},
		latitude: {
			type: Number,
			required: true,
		},
		longitude: {
			type: Number,
			required: true,
		},
		state: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "state",
			required: true,
		},
		lga: {
			type: String,
			required: true,
		},
		setAsDefault: {
			type: Boolean,
			required: true,
			default: false,
		},
		status: {
			type: String,
			enum: ["active", "deleted"],
			default: "active",
		},
	},
	{
		timestamps: true,
	}
);

const UserAddress = new mongoose.Schema(
	{
		userId: {
			type: Number,
			required: true,
		},
		addresses: [Address],
	},
	{
		timestamps: true,
		collection: "userDeliveryAddresses",
	}
);

export const UserDeliveryAddress = mongoose.model(
	"userDeliveryAddress",
	UserAddress
);

