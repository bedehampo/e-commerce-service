import { NextFunction, Response } from "express";
import { AdminRequest } from "../../utils/interfaces";
import { successResponse } from "../../helpers";
import { NotFoundError } from "../../errors";
import { Deal } from "../../model/shop/deal";
import { subDays, startOfDay, endOfDay } from "date-fns";
import { Category } from "../../model/admin/category";
import { DealRequest } from "../../model/shop/dealRequest";
import { getStatsYear } from "../../utils/global";
import userService from "../../lib/userService";

const userToken =
	"eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJNYWluIFRva2VuIiwidXNlckRldGFpbHMiOnsiaWQiOjEsImJ1c2luZXNzSWQiOjAsImZpcnN0TmFtZSI6IlByZWNpb3VzIiwibGFzdE5hbWUiOiJBZGVkaWJ1IiwiZW1haWwiOm51bGwsInByb2ZpbGVQaG90b1VybCI6bnVsbCwibW9iaWxlTnVtYmVyIjoiMjM0ODE4ODk5NjgyMSIsInJvbGVJZCI6MCwicm9sZU5hbWUiOiIiLCJwZXJtaXNzaW9ucyI6W10sImRlZmF1bHRSb2xlIjp0cnVlfSwidXNlcm5hbWUiOiIyMzQ4MTg4OTk2ODIxIiwiaWF0IjoxNzA2NjMzMjI1LCJleHAiOjE3MzgxNjkyMjV9.W3DjSEarZTNo-nKCUZn7CEf8wAB52J7bHZOY_podrHBjVv69cvcjtFNo3_QSr8RK10HhZ0xfviBIXUEp6JIejLSp9f_G9GZ03vqaikYPz1iQE7nDqgWROhDeG98xFUrQC6GGvq-CUXvMntOA8f1AhBYET5afMiB5qrBsaEb3eVapWJvrN_YCMJc5eVba2tlkol17EGjBpB3Gghx18eIA0shK7AUyUaEmiqbNq7HYSD0PjsGYvxLY7CgU8gpbJD0oxitnMXqCJjReR8XfBUCzhS0BDnkaw6oKLfelCV-Igqm4-kwsxItqWrKx22o-2wahNf8C939YuFkRAqWQTaWYIg";

export const dealDashboard = async (
	req: AdminRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		req.adminUser._id;
		const sevenDaysAgo = subDays(startOfDay(new Date()), 7);
		const lastWeekAgo = subDays(
			startOfDay(sevenDaysAgo),
			7
		);
		const now = endOfDay(new Date());

		const deals = await Deal.find();
		const deals7DaysAgo = await Deal.find({
			createdAt: {
				$gte: sevenDaysAgo,
				$lte: now,
			},
		});
		const lastWeekDeals = await Deal.find({
			createdAt: {
				$gte: lastWeekAgo,
				$lte: sevenDaysAgo,
			},
		});

		const dealCountNow = deals.length;
		const dealCount7DaysAgo = deals7DaysAgo.length;
		const dealCountLastWeek = lastWeekDeals.length;

		const twoWeekPercentageDifference =
			calculatePercentageDifference(
				dealCountLastWeek,
				dealCount7DaysAgo
			);

		return res.send(
			successResponse(`Deals successfully fetched.`, {
				totalDeals: dealCountNow,
				twoWeekPercentageDifference:
					twoWeekPercentageDifference,
				lastWeekDeals: dealCount7DaysAgo,
			})
		);
	} catch (error) {
		next(error);
	}
};

const calculatePercentageDifference = (
	countLastWeek: number,
	countThisWeek: number
): string => {
	const difference = countThisWeek - countLastWeek;
	const percentage = (
		(difference / countLastWeek) *
		100
	).toFixed(2);
	if (difference > 0) {
		return `+${percentage}%`;
	} else if (difference < 0) {
		return `${percentage}%`;
	} else {
		return "0%";
	}
};

export const getDealsAdmin = async (
	req: AdminRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		req.adminUser._id;
		const searchParam = req.query.search;
		// get the deals
		let deals = await Deal.find();
		let totalDeals = deals.length;
		let activeDeal = 0;
		let closedDeal = 0;

		// get user details
		const getUserDetails = async (userId: number) => {
			userService.setToken(userToken);
			const user = await userService.getUserById(userId);
			if (user) {
				return {
					logo: user.profilePhotoUrl,
					fullName: `${user.firstName} ${user.lastName}`,
					email: user.email,
				};
			}
			return {};
		};

		const getCategory = async (categoryId) => {
			const category = await Category.findOne({
				_id: categoryId,
			});
			if (category) {
				return category.name;
			}
			return "";
		};
		// get the status statistics
		const dealInfo = await Promise.all(
			deals.map(async (deal) => {
				const dealOwner = await getUserDetails(deal.userId);
				const category = await getCategory(deal.category);
				const dealResponses = await DealRequest.find({
					dealId: deal._id,
				}).count();
				const supplierQuantity = await DealRequest.find({
					dealId: deal._id,
					status: "completed",
				}).count();

				if (deal.status === "active") {
					activeDeal++;
				} else if (deal.status === "closed") {
					closedDeal++;
				}
				return {
					_id: deal._id,
					publisher: dealOwner,
					productName: deal.productName,
					productDescription: deal.description,
					quantity: deal.quantity,
					responses: dealResponses,
					noOfSuppliers: supplierQuantity,
					price: deal.price,
					category: category,
					status: deal.status,
				};
			})
		);

		let dealData = await Promise.all(dealInfo);

		if (searchParam) {
			dealData = dealData.filter((deal) =>
				JSON.stringify(deal)
					.toLowerCase()
					.includes(searchParam.toString().toLowerCase())
			);
		}

		const dealCount = {
			totalDeals,
			activeDeal,
			closedDeal,
		};

		return res.send(
			successResponse("Deals retrieved", {
				dealData,
				dealCount,
			})
		);
	} catch (error) {
		next(error);
	}
};

export const getDealStats = async (
	req: AdminRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		req.adminUser._id;
		const year = parseInt(req.params.year, 10);
		const monthlyStats = [];
		for (let month = 0; month < 12; month++) {
			const startDate = new Date(year, month, 1);
			const endDate = new Date(year, month + 1, 0);
			const dealCount = await Deal.countDocuments({
				createdAt: {
					$gte: startDate,
					$lte: endDate,
				},
			});
			monthlyStats.push({
				month: getStatsYear[month + 1],
				year,
				dealCount: dealCount,
			});
		}
		return res.send(
			successResponse(
				"Deal creation statistics",
				monthlyStats
			)
		);
	} catch (error) {
		next(error);
	}
};

export const getSingleDealAdmin = async (
	req: AdminRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const dealId = req.params.dealId;
		const deal = await Deal.findOne({ _id: dealId })
			.populate({
				path: "category",
				select: "name _id",
			})
			.populate({
				path: "state",
				select: "name _id",
			});
		if (!deal) {
			throw new NotFoundError("Deal not found");
		}

		// Function to fetch user details
		const getUserDetails = async (userId: number) => {
				userService.setToken(userToken);
				const user = await userService.getUserById(userId);
			if (user) {
				return {
					logo: user.profilePhotoUrl,
					fullName: `${user.firstName} ${user.lastName}`,
					email: user.email,
					mobileNumber: user.mobileNumber,
					tier: user.tier,
				};
			}
			return {};
		};

		// Function to fetch category name
		const getCategoryName = async (categoryId: any) => {
			const category = await Category.findOne({
				_id: categoryId,
			});
			return category ? category.name : "";
		};

		const owner = await getUserDetails(deal.userId);
		const category = await getCategoryName(deal.category);

		// Fetch deal responses and update them with user details
		const responses = await DealRequest.find({
			dealId: deal._id,
		});
		const updatedResponses = await Promise.all(
			responses.map(async (response) => {
				const userDetails = await getUserDetails(
					response.userId
				);
				return {
					...response.toObject(),
					request: userDetails,
				};
			})
		);

		const modifiedDeal = {
			deal,
			dealOwner: owner,
			responses: updatedResponses,
		};

		return res.send(
			successResponse("Single deal retrieved", modifiedDeal)
		);
	} catch (error) {
		next(error);
	}
};
