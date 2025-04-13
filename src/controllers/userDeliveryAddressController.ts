import { NextFunction, Response } from "express";
import { CustomRequest } from "../utils/interfaces";
import { checkUserById } from "../middlewares/validators";
import { CreateUserDeliveryAddressInput } from "../validation/userDeliveryAddress.schema";
import { UserDeliveryAddress } from "../model/shop/userDeliveryAddress";
import mongoose from "mongoose";
import { successResponse } from "../helpers";
import { NotFoundError, ValidationError } from "../errors";
import parsePhoneNumber from "libphonenumber-js";
import { State } from "../model/shop/state";

const isValidNigeriaMobileNumber = (
	phoneNumber: string
): boolean => {
	try {
		const parsedNumber = parsePhoneNumber(
			phoneNumber,
			"NG"
		);
		console.log(parsedNumber);
		return (
			parsedNumber &&
			parsedNumber.isValid() &&
			parsedNumber.country === "NG"
		);
	} catch (error) {
		return false;
	}
};


export const saveUserDeliveryAddress = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const userId = req.user && req.user.id;
		const userService = req.userService;
		await checkUserById(userId, userService);

		let {
			receiversName,
			receiversPhoneNumber,
			additionalPhoneNumber,
			deliveryAddress,
			latitude,
			longitude,
			state,
			lga,
			setAsDefault,
		} = req.body as CreateUserDeliveryAddressInput["body"];

		// validate the phone number
		if (!isValidNigeriaMobileNumber(receiversPhoneNumber)) {
			throw new ValidationError(
				"Invalid Nigeria mobile number"
			);
		}
		// validate the phone number 2 if provided
		if (
			additionalPhoneNumber &&
			!isValidNigeriaMobileNumber(additionalPhoneNumber)
		) {
			throw new ValidationError(
				"Invalid Nigeria mobile number"
			);
		}
		// ensure the numbers are not the same
		if (receiversPhoneNumber === additionalPhoneNumber) {
			throw new ValidationError(
				"Both numbers can't be the same"
			);
		}
		// Validate state and LGA
		const stateExists = await State.findById(state);

		if (!stateExists) {
			throw new NotFoundError("State not found");
		}

		if (!stateExists.lgas.includes(lga)) {
			throw new NotFoundError("LGA not found");
		}

		if (
			setAsDefault === undefined ||
			setAsDefault === false
		) {
			const existingDefaultAddress =
				await UserDeliveryAddress.findOne({
					userId,
					"addresses.setAsDefault": true,
				});

			// If there is no existing default address, set setAsDefault to true
			setAsDefault = existingDefaultAddress ? false : true;
		}

		if (setAsDefault === true) {
			const existingDefaultAddress =
				await UserDeliveryAddress.findOne({
					userId,
					"addresses.setAsDefault": true,
				});

			if (existingDefaultAddress) {
				existingDefaultAddress.addresses.forEach(
					(address) => {
						address.setAsDefault = false;
					}
				);
				await existingDefaultAddress.save();
			}
		}

		const payload = {
			receiversName,
			receiversPhoneNumber,
			additionalPhoneNumber,
			deliveryAddress,
			latitude,
			longitude,
			state,
			lga,
			setAsDefault,
		};

		let userDeliveryAddress =
			await UserDeliveryAddress.findOne({ userId });

		// Check only active addresses
		const activeAddressesCount = userDeliveryAddress
			? userDeliveryAddress.addresses.filter(
					(addr) => addr.status === "active"
			  ).length
			: 0;

		if (activeAddressesCount >= 15) {
			throw new ValidationError(
				"Saved address limit exceeded"
			);
		}
        
		let newAddress;
		if (userDeliveryAddress) {
			const duplicateAddress =
				userDeliveryAddress.addresses.find(
					(addr) =>
						addr.status === "active" &&
						addr.deliveryAddress === deliveryAddress
				);
			if (duplicateAddress) {
				throw new ValidationError(
					"Duplicate delivery address found"
				);
			}
			userDeliveryAddress.addresses.push(payload);
			newAddress =
				userDeliveryAddress.addresses[
					userDeliveryAddress.addresses.length - 1
				];
			await userDeliveryAddress.save();
		} else {
			userDeliveryAddress = new UserDeliveryAddress({
				userId,
				addresses: [payload],
			});
			await userDeliveryAddress.save();
			newAddress = userDeliveryAddress.addresses[0];
		}

		return res.send(
			successResponse(
				"Delivery address saved successfully",
				newAddress
			)
		);
	} catch (error) {
		next(error);
	}
};

// edit user deliver address
export const updateDeliveryAddress = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const userId = req.user && req.user.id;
		const userService = req.userService;
		await checkUserById(userId, userService);
		const addressId = req.params.id;
		let {
			receiversName,
			receiversPhoneNumber,
			additionalPhoneNumber,
			deliveryAddress,
			state,
			lga,
			setAsDefault,
		} = req.body as CreateUserDeliveryAddressInput["body"];
		// validate user phone number
		if (!isValidNigeriaMobileNumber(receiversPhoneNumber)) {
			throw new ValidationError(
				"Invalid Nigeria mobile number"
			);
		}
		// validate the phone number 2 if provided
		if (
			additionalPhoneNumber &&
			!isValidNigeriaMobileNumber(additionalPhoneNumber)
		) {
			throw new ValidationError(
				"Invalid Nigeria mobile number"
			);
		}
		// ensure the number are not same
		if (receiversPhoneNumber === additionalPhoneNumber) {
			throw new ValidationError(
				"Both numbers can't be the same"
			);
		}
		// Validate state and LGA
		const stateExists = await State.findById(state);

		if (!stateExists) {
			throw new NotFoundError("State not found");
		}

		if (!stateExists.lgas.includes(lga)) {
			throw new NotFoundError("LGA not found");
		}

		if (setAsDefault === undefined) {
			setAsDefault = false;
		}
		const payload = {
			receiversName,
			receiversPhoneNumber,
			additionalPhoneNumber,
			deliveryAddress,
			state,
			lga,
			setAsDefault,
		};
		const userAddress = await UserDeliveryAddress.findOne({
			userId: userId,
		});
		if (!userAddress)
			throw new NotFoundError("user address not found");

		const duplicateAddress = userAddress.addresses.find(
			(addr) => addr.deliveryAddress === deliveryAddress
		);

		if (duplicateAddress) {
			throw new ValidationError(
				"Duplicate delivery address found"
			);
		}

		if (setAsDefault === true) {
			const existingDefaultAddress =
				await UserDeliveryAddress.findOne({
					userId,
					"addresses.setAsDefault": true,
				});

			if (existingDefaultAddress) {
				existingDefaultAddress.addresses.forEach(
					(address) => {
						address.setAsDefault = false;
					}
				);
				await existingDefaultAddress.save();
			}
		}
		const newAddressId = new mongoose.Types.ObjectId(
			addressId
		);
		const address = userAddress.addresses.find((address) =>
			address._id.equals(newAddressId)
		);
		Object.assign(address, payload);
		await userAddress.save();
		return res.send(
			successResponse(
				"Delivery address updated successfully",
				address
			)
		);
	} catch (error) {
		next(error);
	}
};

// get all saved address
export const getDeliverySavedAddresses = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const userId = req.user && req.user.id;
		const userService = req.userService;
		await checkUserById(userId, userService);

		const userAddresses = await UserDeliveryAddress.findOne(
			{ userId }
		).populate({
			path: "addresses.state",
			select: "_id name",
		});

		if (!userAddresses) {
			return res.send(
				successResponse("User has no saved addresses", null)
			);
		} else {
			// Filter addresses with active status
			const activeAddresses =
				userAddresses.addresses.filter(
					(address) => address.status === "active"
				);

			// Sort addresses with setAsDefault = true first
			activeAddresses.sort(
				(a, b) =>
					(b.setAsDefault ? 1 : 0) -
					(a.setAsDefault ? 1 : 0)
			);

			return res.send(
				successResponse(
					"User saved addresses retrieved successfully",
					{
						...userAddresses.toObject(),
						addresses: activeAddresses,
					}
				)
			);
		}
	} catch (error) {
		next(error);
	}
};

// get a single save address
export const getSingleSavedAddress = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const userId = req.user && req.user.id;
		const userService = req.userService;
		await checkUserById(userId, userService);

		const addressId = req.params.id;
		const newAddressId = new mongoose.Types.ObjectId(
			addressId
		);

		const userAddresses = await UserDeliveryAddress.findOne(
			{
				userId: userId,
			}
		).populate({
			path: "addresses.state",
			select: "_id, name",
		});

		const address = userAddresses.addresses.find(
			(address) =>
				address._id.equals(newAddressId) &&
				address.status === "active"
		);

		if (!address) {
			throw new NotFoundError("Address not found");
		}

		return res.send(
			successResponse(
				"User's saved address retrieved successfully",
				address
			)
		);
	} catch (error) {
		next(error);
	}
};

export const deleteAddress = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const userId = req.user && req.user.id;
		const userService = req.userService;
		await checkUserById(userId, userService);
		const addressId = req.params.id;
		const newAddressId = new mongoose.Types.ObjectId(
			addressId
		);

		const userAddresses = await UserDeliveryAddress.findOne(
			{
				userId: userId,
				"addresses._id": newAddressId,
			}
		);

		if (!userAddresses) {
			throw new NotFoundError(
				"User has no saved address with the provided ID"
			);
		}

		await UserDeliveryAddress.updateOne(
			{ userId: userId, "addresses._id": newAddressId },
			{ $set: { "addresses.$.status": "deleted" } }
		);

		return res.send(
			successResponse("Address deleted successfully", null)
		);
	} catch (error) {
		next(error);
	}
};
