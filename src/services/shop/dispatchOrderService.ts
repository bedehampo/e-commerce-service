import OrionDeliveryService from "../../lib/orion";
import AthenaDeliveryService from "../../lib/athena";
import GigService from "../../lib/gig";
import KwikService from "../../lib/kwik";
import DellymanService from "../../lib/dellyman";
import { sendMessage } from "../sendMessage";
import { OrderGroup } from "../../model/shop/OrderGroup";
import {
	DeliveryCompanies,
	DellyManBookOrderPayload,
	DellymanPackage,
	IOrderGroup,
	KwikCreateTaskPayload,
	OrderDeliveryStatus,
	OrderStatus,
	OrionInitiateDeliveryPayload,
} from "../../types/order";
import config from "../../config";
import { formatDateToCustomFormat } from "../../utils/global";
import { IUser } from "../../types/user";
import { Order } from "../../model/shop/order";
import { IShop } from "../../model/shop/shop";
import { UserDeliveryAddress } from "../../model/shop/userDeliveryAddress";
import { OrderDeliveryPrices } from "../../model/shop/orderDeliveryPrices";

const dispatchOrderService = async (
	orderGroupData: IOrderGroup,
	shop: IShop,
	user: IUser,
	session: any
) => {
	//handle  gig delivery
	// console.log("hello dispatch");
	//  console.log(orderGroupData.deliveryMerchant.name);

	// console.log(orderGroupData);

	let deliveryMerchantName = "";
	if (orderGroupData.deliveryMerchant) {
		if (orderGroupData.deliveryMerchant.name) {
		}
	}
	if (
		orderGroupData?.deliveryMerchant?.name ===
		DeliveryCompanies.Kwik
	) {
		console.log("kwik");
		let shipmentId = await handleKwikDispatchOrder(
			shop,
			orderGroupData,
			session
		);
		return shipmentId;
	}
	if (
		orderGroupData?.deliveryMerchant?.name ===
		DeliveryCompanies.Gig
	) {
		console.log("gig");
		const authResponse = await GigService.login();
		let requestDeliveryPayload = {
			SenderAddress: shop.address,
			SenderName: user.firstName,
			SenderLocality: "Ifako Ijaye",
			ReceiverName: orderGroupData.receiversName,
			ReceiverAddress:
				orderGroupData.deliveryAddressDescription,
			ReceiverPhoneNumber:
				orderGroupData.receiversPhoneNumber,
			VehicleType: "BIKE",
			SenderPhoneNumber: user.mobileNumber,
			ReceiverStationId: "4",
			SenderStationId: "4",
			UserId: authResponse.UserId,
			ReceiverLocation: {
				Latitude:
					orderGroupData.deliveryAddress.latitude.toString(),
				Longitude:
					orderGroupData.deliveryAddress.longitude.toString(),
				// Latitude: "7.5483775",
				// Longitude: "3.3883414",
			},
			SenderLocation: {
				Latitude: shop.location.coordinates[1].toString(),
				Longitude: shop.location.coordinates[0].toString(),
				// Latitude: "6.639438",
				// Longitude: "3.330983",
			},
			PreShipmentItems: [
				{
					ItemName: "jhhh",
					Quantity: Number(orderGroupData.orders.length),
					ItemType: "Normal",
					ShipmentType: "Regular",
				},
			],
		};
		console.log(requestDeliveryPayload);
		GigService.setToken(authResponse.access_token);
		const initiateDelivery =
			await GigService.requestDelivery(
				requestDeliveryPayload
			);

		//call third part delivery service
		let shipmentId = initiateDelivery.waybill;
		await OrderGroup.findOneAndUpdate(
			{ _id: orderGroupData._id },
			{
				deliveryStatus: OrderDeliveryStatus.PACKAGING,
				status: OrderStatus.ACCEPTED,
				shipmentId,
			},
			{ session }
		);

		const orders = orderGroupData.orders;
		const todaysDate = new Date();
		for (let order of orders) {
			await Order.findByIdAndUpdate(
				order,
				{
					status: OrderStatus.ACCEPTED,
					deliveryStatus: OrderDeliveryStatus.PACKAGING,
					acceptedAt: todaysDate,
				},
				{ session }
			);
		}

		return shipmentId;
	}

	if (
		orderGroupData.deliveryMerchant.name ===
		DeliveryCompanies.Dellyman
	) {
		console.log("dellyman");
		let shipmentId = await handleDellyManDispatchOrder(
			shop,
			orderGroupData,
			session
		);
		return shipmentId;
	}
};

export default dispatchOrderService;

const handleKwikDispatchOrder = async (
	shop: IShop,
	orderGroupData: IOrderGroup,
	session: any
): Promise<string> => {
	// console.log("hello kwik");
	const authResponse = await KwikService.login();

	let accessToken = authResponse.access_token;
	let vendorId = authResponse.vendor_details.vendor_id;

	let currentDate = new Date(); // Current date and time
	let oneHourInMilliseconds = 60 * 60 * 1000; // On
	let oneDayInMilliseconds = 24 * 60 * 60 * 1000; // One day in milliseconds
	let pickupDateTime = new Date(
		currentDate.getTime() + oneHourInMilliseconds
	);
	let DeliveryDateTime = new Date(
		currentDate.getTime() + oneDayInMilliseconds
	);

	// return {
	//   pickupDateTime: formatDateToCustomFormat(pickupDateTime),
	//   secondPickupDateTime: formatDateToCustomFormat(secondPickupDateTime),
	// };
	let requestDeliveryPayload: KwikCreateTaskPayload = {
		access_token: accessToken,
		vendor_id: vendorId,
		domain_name: config.kwik.domain,
		timezone: 60,
		is_multiple_tasks: 1,
		layout_type: 0,
		has_pickup: 1,
		has_delivery: 1,
		auto_assignment: 1,
		amount: String(orderGroupData.totalDeliveryFee),
		surge_cost: 0,
		surge_type: 0,
		is_cod_job: 0,
		cash_handling_charges: 0,
		cash_handling_percentage: 0,
		net_processed_amount: 0,
		kwister_cash_handling_charge: "0",
		delivery_charge_by_buyer: 1,
		delivery_charge: orderGroupData.totalDeliveryFee,
		collect_on_delivery: 0,
		vehicle_id: 4,
		pickup_delivery_relationship: 0,
		insurance_amount: 0,
		total_no_of_tasks: 1,
		total_service_charge: 0,
		payment_method: 524288,
		delivery_instruction:
			orderGroupData.deliveryAddressDescription,
		is_loader_required: 0,
		loaders_amount: 0,
		loaders_count: 0,
		parcel_amount: 0,
		pickups: [
			{
				address: shop.address,
				name: shop.brand_name,
				latitude: shop.location.coordinates[1],
				longitude: shop.location.coordinates[0],
				// latitude: config.env.isDevelopment
				//   ? 30.7188978
				//   : shop.location.coordinates[1],
				// longitude: config.env.isDevelopment
				//   ? 76.8794589
				//   : shop.location.coordinates[0],
				time: formatDateToCustomFormat(pickupDateTime),
				phone: shop.official_phone_number,
				email: shop.official_email,
			},
		],
		deliveries: [
			{
				address: orderGroupData.deliveryAddressDescription,
				name: orderGroupData.receiversName,
				latitude: orderGroupData.deliveryAddress.latitude,
				longitude: orderGroupData.deliveryAddress.longitude,
				// latitude: config.env.isDevelopment
				//   ? 30.6951827
				//   : shop.location.coordinates[1],
				// longitude: config.env.isDevelopment
				//   ? 76.8794589
				//   : shop.location.coordinates[0],
				time: formatDateToCustomFormat(DeliveryDateTime),
				phone: orderGroupData.receiversPhoneNumber,
				has_return_task: false,
				is_package_insured: 0,
				hadVairablePayment: 1,
				hadFixedPayment: 0,
				is_task_otp_required: 1,
			},
		],
	};
	//    console.log(requestDeliveryPayload);

	const initiateDelivery =
		await KwikService.requestDelivery(
			requestDeliveryPayload
		);
	console.log(initiateDelivery);

	console.log("hello hello");
	let shipmentId = initiateDelivery.unique_order_id;

	//call third part delivery service

	console.log(orderGroupData._id);

	await OrderGroup.findByIdAndUpdate(
		orderGroupData._id,
		{
			deliveryStatus: OrderDeliveryStatus.PACKAGING,
			status: OrderStatus.ACCEPTED,
			shipmentId: shipmentId,
		},
		{ session }
	);
	const orders = orderGroupData.orders;
	const todaysDate = new Date();
	for (let order of orders) {
		await Order.findByIdAndUpdate(
			order,
			{
				status: OrderStatus.ACCEPTED,
				deliveryStatus: OrderDeliveryStatus.PACKAGING,
				acceptedAt: todaysDate,
			},
			{ session }
		);
	}

	return shipmentId;
};

const handleDellyManDispatchOrder = async (
	shop: IShop,
	orderGroupData: IOrderGroup,
	session: any
): Promise<string> => {
	// console.log("hello kwik");
	const authResponse = await KwikService.login();

	let accessToken = authResponse.access_token;
	let vendorId = authResponse.vendor_details.vendor_id;

	let currentDate = new Date(); // Current date and time
	let oneHourInMilliseconds = 60 * 60 * 1000; // On
	let oneDayInMilliseconds = 24 * 60 * 60 * 1000; // One day in milliseconds
	let pickupDateTime = new Date(
		currentDate.getTime() + oneHourInMilliseconds
	);
	let DeliveryDateTime = new Date(
		currentDate.getTime() + oneDayInMilliseconds
	);

	// const orderDeliveryDetails = await OrderDeliveryPrices.findById(
	//   orderGroupData.orderDeliveryDetails
	// ).populate({
	//   path: "orderDeliveryDetails",
	//   select: "userDeliveryAddress",
	//   populate: {
	//     path: "userDeliveryAddress",
	//     select: "state",
	//     populate: {
	//       path: "state",
	//     },
	//   },
	// });

	console.log()

	const orderDeliveryDetails =
		await OrderDeliveryPrices.findOne({
			_id: orderGroupData.orderDeliveryDetails,
		}).populate({
			path: "userDeliveryAddress",
			select: "addresses",
		});
	
	// const dd = await UserDeliveryAddress.findById()

	const deliveryStateName =
		//@ts-ignore
		orderDeliveryDetails.orderDeliveryDetails
			.userDeliveryAddress.state.name;
	//@ts-ignore
	const shopStateName = shop.state.name;

	// // find order populate cartItem and product in cartItem
	const orders = await Order.find({
		_id: { $in: orderGroupData.orders },
	}).populate({
		path: "cartItem",
		select: "product",
		populate: {
			path: "product",
			select: "productName productDescription",
		},
	});

	const productNames = orders.map((order) => {
		//@ts-ignore
		return order.cartItem.product;
	});

	const dellymanPackage: DellymanPackage = {
		DeliveryContactName: orderGroupData.receiversName,
		DeliveryContactNumber:
			orderGroupData.receiversPhoneNumber,
		DeliveryGooglePlaceAddress:
			orderGroupData.deliveryAddressDescription,
		DeliveryLandmark:
			orderGroupData.deliveryAddressDescription,
		PackageDescription: productNames.join(", "),
		PickUpCity: shopStateName,
		PickUpState: shopStateName,
		DeliveryCity: deliveryStateName,
		DeliveryState: deliveryStateName,
	};
	// const

	// const Packages: DellymanPackage[] = orders.map((order) => {
	//   return {
	//     //@ts-ignore
	//     PackageDescription: order.cartItem.product.productName,
	//     DeliveryContactName: orderGroupData.receiversName,
	//     DeliveryContactNumber: orderGroupData.receiversPhoneNumber,
	//     DeliveryGooglePlaceAddress: orderGroupData.deliveryAddressDescription,
	//     DeliveryLandmark: orderGroupData.deliveryAddressDescription,
	//     PickUpCity
	//   };
	// });
	let requestDeliveryPayload: DellyManBookOrderPayload = {
		PaymentMode: "online",
		Vehicle: "1",
		PickUpContactName: shop.brand_name,
		PickUpContactNumber: shop.official_phone_number,
		PickUpGooglePlaceAddress: shop.address,
		IsInstantDelivery: "0",
		IsProductOrder: 0,
		PickUpRequestedTime: "07:00 AM to 08:30 AM",
		PickUpRequestedDate: new Date()
			.toISOString()
			.split("T")[0]
			.replace(/-/g, "/"),
		DeliveryRequestedTime: "08:30 AM to 10:00 AM",
		DeliveryTimeline: "sameDay",
		OrderRef: orderGroupData._id,
		Packages: [dellymanPackage],
		CompanyID: orderDeliveryDetails.dellymanCompanyId,
		PickUpLandmark: "",
	};

	const initiateDelivery = await DellymanService.bookOrder(
		requestDeliveryPayload
	);

	let shipmentId = initiateDelivery.TrackingID;

	//call third part delivery service

	const dellymanData = {
		OrderID: initiateDelivery.OrderID,
		OrderCode: initiateDelivery.OrderCode,
		TrackingID: initiateDelivery.TrackingID,
	};

	await OrderGroup.findByIdAndUpdate(
		orderGroupData._id,
		{
			deliveryStatus: OrderDeliveryStatus.PACKAGING,
			status: OrderStatus.ACCEPTED,
			shipmentId: shipmentId,
			dellymanDetails: dellymanData,
		},
		{ session }
	);
	const orderIds = orderGroupData.orders;
	const todaysDate = new Date();
	for (let order of orderIds) {
		await Order.findByIdAndUpdate(
			order,
			{
				status: OrderStatus.ACCEPTED,
				deliveryStatus: OrderDeliveryStatus.PACKAGING,
				acceptedAt: todaysDate,
				shipmentId: shipmentId,
				dellymanDetails: dellymanData,
			},
			{ session }
		);
	}

	return shipmentId;
};
