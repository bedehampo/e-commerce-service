import { Shop } from "../../model/shop/shop";
// import { User } from "../../model/User";
import { NotFoundError, ValidationError } from "../../errors";

export const recordShopVisit = async (shopId, userId) => {
	try {
		// Ensure shopId and userId are valid
		if (!shopId || !userId) {
			throw new ValidationError(
				"Shop ID and User ID are required"
			);
		}

		const shop = await Shop.findOne({ _id: shopId });

		// Ensure the shop exists
		if (!shop) {
			throw new NotFoundError("Shop not found");
		}

		// Initialize shopVisitCount if it doesn't exist
		if (
			!shop.shopVisitCount ||
			typeof shop.shopVisitCount !== "object"
		) {
			shop.shopVisitCount = {
				visitors: [],
				visits: [],
				newVisit: [],
			};
		}

		const userExists =
			shop.shopVisitCount.visitors.includes(userId);
		const currentTime = new Date();

		// Add a new visit
		if (!userExists) {
			shop.shopVisitCount.visitors.push(userId);
			shop.shopVisitCount.visits.push({
				count: 1,
				time: currentTime,
			});
			shop.shopVisitCount.newVisit.push({
				count: 1,
				time: currentTime,
			});
			console.log("New user visit recorded:", userId);
		} else {
			shop.shopVisitCount.visits.push({
				count: 1,
				time: currentTime,
			});
			console.log("Existing user visit recorded:", userId);
		}

		// Save the shop document
		await shop.save();
		console.log("Shop visit recorded successfully");
		return shop;
	} catch (error) {
		console.error(
			"Error recording shop visit:",
			error.message
		);
		console.error(error.stack);
		throw new ValidationError("Failed to record visit");
	}
};

export const getVisitByYear = async (year: string) => {
	try {
		const shops = await Shop.find();
		const monthlyVisits = {};

		// returning visits
		shops.forEach((shop) => {
			shop.shopVisitCount.visits.forEach((visit) => {
				const visitYear = visit.time.getFullYear();
				const visitMonth = visit.time.getMonth() + 1;
				if (visitYear.toString() === year) {
					if (!monthlyVisits[visitMonth]) {
						monthlyVisits[visitMonth] = {
							visit: 0,
							newVisit: 0,
						};
					}
					monthlyVisits[visitMonth].visits += visit.count;
				}
			});
			// newVisit
			shop.shopVisitCount.newVisit.forEach((newVisit) => {
				const newVisitYear = newVisit.time.getFullYear();
				const newVisitMonth = newVisit.time.getMonth() + 1;
			});
		});
	} catch (error) {
		throw error;
	}
};
