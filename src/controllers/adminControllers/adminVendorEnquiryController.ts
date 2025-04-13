import { NextFunction, Response } from "express";
import { AdminNewRequest } from "../../utils/interfaces";
import { VendorEnquiryInput } from "../../validation/createCategory.schema";
import { VendorEnquiryGroup } from "../../model/admin/vendorEnquiry";
import { NotFoundError } from "../../errors";
import { successResponse } from "../../helpers";
import { VendorEnquiryType } from "../../model/admin/VendorEnquiryType";
import { VendorEnquiryReason } from "../../model/admin/vendorEnquiryReason";

export const createVendorEnquiryAdmin = async (
	req: AdminNewRequest,
	res: Response,
	next: NextFunction
) => {
	// Start a session
	const session = await VendorEnquiryGroup.startSession();
	session.startTransaction();

	try {
		// Extract the data from the request
		const { enquiryGroupName, enquiryGroupTypes } =
			req.body as VendorEnquiryInput["body"];

		// Authorization & Authentication (placeholder for your existing auth logic)
		const user = req.user; // Assuming user is authenticated

		// Check if the enquiry group exists
		const existingEnquiryGroup =
			await VendorEnquiryGroup.findOne({
				name: enquiryGroupName,
			});
		if (existingEnquiryGroup) {
			throw new NotFoundError(
				"Enquiry group already exists"
			);
		}

		// Create the enquiry group
		const newEnquiryGroup = new VendorEnquiryGroup({
			name: enquiryGroupName,
		});
		await newEnquiryGroup.save({ session });

		// Batch insert for types and reasons
		const enquiryTypePromises = enquiryGroupTypes.map(
			async (enquiryGroupType) => {
				const { enquiryType, reasons } = enquiryGroupType;

				// Check if the enquiry type exists
				const existingEnquiryType =
					await VendorEnquiryType.findOne({
						name: enquiryType,
					});
				if (existingEnquiryType) {
					throw new NotFoundError(
						`Enquiry type ${enquiryType} already exists`
					);
				}

				// Create the enquiry type
				const newEnquiryType = new VendorEnquiryType({
					vendorEnquiryGroupId: newEnquiryGroup._id,
					name: enquiryType,
				});
				await newEnquiryType.save({ session });
				newEnquiryGroup.types.push(newEnquiryType._id);

				// Batch insert reasons if provided
				if (reasons && reasons.length > 0) {
					const reasonPromises = reasons.map(
						async (reason) => {
							const existingReason =
								await VendorEnquiryReason.findOne({
									name: reason,
								});
							if (existingReason) {
								throw new NotFoundError(
									`Reason ${reason} already exists`
								);
							}

							const newReason = new VendorEnquiryReason({
								vendorEnquiryTypeId: newEnquiryType._id,
								name: reason,
							});
							await newReason.save({ session });
							newEnquiryType.reasons.push(newReason._id);
						}
					);

					// Wait for all reasons to be processed
					await Promise.all(reasonPromises);
				}
				await newEnquiryType.save({ session });
			}
		);

		// Wait for all enquiry types and reasons to be processed
		await Promise.all(enquiryTypePromises);

		// Save the enquiry group with types
		await newEnquiryGroup.save({ session });

		// Commit the transaction
		await session.commitTransaction();
		session.endSession();

		return res.send(
			successResponse(
				"Vendor enquiry group created successfully",
				newEnquiryGroup
			)
		);
	} catch (error) {
		// Rollback transaction in case of error
		await session.abortTransaction();
		session.endSession();
		next(error);
	}
};


