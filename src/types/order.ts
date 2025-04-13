import { IPhoneNumber, IProduct } from "../utils/interfaces";
import mongoose, { Query, Document, Schema } from "mongoose";

export const enum DeliveryCompanies {
  Orion = "Orion",
  Athena = "Athena",
  Gig = "GIG Logistics",
  Kwik = "Kwik Delivery",
  Dellyman = "Dellyman",
}

export type CalculateGigShipmentPriceInput = {
  ReceiverAddress: string;
  CustomerCode?: string;
  // SenderLocality: string;
  SenderAddress: string;
  ReceiverPhoneNumber: string;
  VehicleType: string;
  SenderPhoneNumber: string;
  SenderName: string;
  ReceiverName: string;
  UserId: string;
  ReceiverStationId: string;
  SenderStationId: string;
  ReceiverLocation: {
    Latitude: string;
    Longitude: string;
  };
  SenderLocation: {
    Latitude: string;
    Longitude: string;
  };
  PreShipmentItems: {
    Quantity: string;
    ItemType: string;
    ItemName: string;
    ShipmentType: string;
  }[];
};

export type RequestGigDeliveryInput = {
  ReceiverAddress: string;
  CustomerCode?: string;
  SenderLocality: string;
  SenderAddress: string;
  ReceiverPhoneNumber: string;
  VehicleType: string;
  SenderPhoneNumber: string;
  SenderName: string;
  ReceiverName: string;
  UserId: string;
  ReceiverStationId: string;
  SenderStationId: string;
  ReceiverLocation: {
    Latitude: string;
    Longitude: string;
  };
  SenderLocation: {
    Latitude: string;
    Longitude: string;
  };
  PreShipmentItems: {
    Quantity: number;
    ItemType: string;
    ItemName: string;
    ShipmentType: string;
  }[];
};

export interface ICartItem extends Document {
  user: number;
  product: IProduct;
  custom_field: {
    name: string;
    value: string;
  };
  status: CartItemStatus;
  amount: number;
  quantity: number;
  shop: string;

  createdAt: Date;
}

export interface GigCaptureDeliveryResponse {
  waybill: string;
  message: string;
  IsBalanceSufficient: string;
  Zone: string;
  WaybillImage: string;
  WaybillImageFormat: string;
  PaymentUrl: string;
}

export interface OrionInitiateDeliveryPayload {
  shopOwnerAddress: {
    latitude: number;
    longitude: number;
  };
  receiversPhoneNumber: string;
  receiversName: string;
  reference: string;
  deliveryAddress: {
    latitude: number;
    longitude: number;
  };
  callBackUrl: string;
}

export interface OrionInitiateDeliveryResponse {
  shipmentId: string;
  reference: string;
  origin: {
    latitude: number;
    longitude: number;
  };
  destination: {
    latitude: number;
    longitude: number;
  };
  deliveryDistance: number;
  deliveryPrice: number;
  receiversName: string;
  receiversPhoneNumber: string;
  shopOwnerAddress: {
    latitude: number;
    longitude: number;
  };
  callBackUrl: string;
}

export enum OrderType {
  DELIVERY = "delivery",
  SELF_PICKUP = "self_pickup",
}

export enum OrderPaymentType {
  PAYONDELIVERY = "pay_on_delivery",
  PAYBYWALLET = "pay_by_wallet",
  BUYNOWPAYLATER = "buy_now_pay_later",
}

//make typescript type for kwikCalculatePricePayload
interface KwikDelivery {
  address: string;
  name: string;
  latitude: number;
  longitude: number;
  time?: string;
  phone: string;
  has_return_task: boolean;
  is_package_insured: number;
}

interface KwikPickup {
  address: string;
  name: string;
  latitude: number;
  longitude: number;
  time?: string;
  phone: string;
  email: string;
}

export type KwikCalculatePricePayload = {
  custom_field_template: string;
  access_token: string;
  domain_name: string;
  timezone: number;
  vendor_id: number;
  is_multiple_tasks: number;
  layout_type: number;
  pickup_custom_field_template: string;
  deliveries: KwikDelivery[];
  has_pickup: number;
  has_delivery: number;
  auto_assignment: number;
  user_id: number;
  pickups: KwikPickup[];
  payment_method: number;
  form_id: number;
  vehicle_id: number;
  delivery_instruction: string;
  delivery_images?: string;
  is_loader_required: number;
  loaders_amount: number;
  loaders_count: number;
  is_cod_job: number;
  parcel_amount: number;
};

interface KwikBackupDelivery {
  address: string;
  name: string;
  latitude: number;
  longitude: number;
  time: string;
  phone: string;
  has_return_task: boolean;
  is_package_insured: number;
}

interface KwikCurrency {
  currency_id: number;
  code: string;
  name: string;
  symbol: string;
  is_zero_decimal_currency: number;
  minimum_amount: number;
}

export interface KwikCalculatePriceResponse {
  currency: KwikCurrency;
  per_task_cost: string;
  pickups: {
    address: string;
    name: string;
    latitude: number;
    longitude: number;
    time: string;
    phone: string;
    email: string;
  }[];
  deliveries: {
    address: string;
    name: string;
    latitude: number;
    longitude: number;
    time: string;
    phone: string;
    has_return_task: boolean;
    is_package_insured: number;
    hadVairablePayment: number;
  }[];
  insurance_amount: number;
  total_no_of_tasks: number;
  total_service_charge: number;
  delivery_charge_by_buyer: number;
  is_cod_job: number;
  is_loader_required: number;
  loaders_amount: number;
  delivery_instruction: string;
  delivery_images: string;
  vehicle_id: number;
  loaders_count: number;
  sareaId: number;
  backupDeliveries: KwikBackupDelivery[];
}

export type KwikCreateTaskPayload = {
  domain_name: string;
  access_token: string;
  vendor_id: number;
  is_multiple_tasks: number;

  // latitude: number;
  // longitude: number;
  timezone: number;
  has_pickup: number;
  has_delivery: number;
  pickup_delivery_relationship: number;
  layout_type: number;
  auto_assignment: number;
  parcel_amount: number;
  pickups: {
    address: string;
    name: string;
    latitude: number;
    longitude: number;
    time: string;
    phone: string;
    email: string;
  }[];
  deliveries: {
    address: string;
    name: string;
    latitude: number;
    longitude: number;
    time: string;
    phone: string;
    has_return_task: boolean;
    is_package_insured: number;
    is_task_otp_required?: number;
    hadVairablePayment: number;
    hadFixedPayment: number;
  }[];
  insurance_amount: number;
  total_no_of_tasks: number;
  total_service_charge: number;
  payment_method: number;
  amount: string;
  surge_cost: number;
  surge_type: number;
  is_cod_job: number;
  cash_handling_charges: number;
  cash_handling_percentage: number;
  net_processed_amount: number;
  kwister_cash_handling_charge: string;
  delivery_charge_by_buyer: number;
  delivery_charge: number;
  collect_on_delivery: number;
  delivery_instruction: string;
  loaders_amount: number;
  loaders_count: number;
  is_loader_required: number;
  delivery_images?: string;
  vehicle_id: number;
};

type AutoAssignmentData = {
  job_id: number;
  broadcast_type: number;
  expires_in: number;
  send_to_all_expires_in: number;
  offline_agents: number;
  put_agent_busy: number;
  user_id: number;
  job_pickup_latitude: number;
  job_pickup_longitude: number;
  job_pickup_datetime: string;
  job_delivery_datetime: string;
  latitude: number;
  relationship: string;
  longitude: number;
  has_pickup: number;
  has_delivery: number;
  accept_button: number;
  send_push: number;
  push_msg: string;
  vertical: number;
  agent_workflow: number;
  team_id: number;
  job_type: number;
  job_time: string;
  related_job_count: number;
  roundRobinConfig: {
    broadcast_type: number;
    is_enabled: number;
    offline_agents: number;
    send_to_all_expires_in: number;
    expires_in: number;
    startingRadius: number;
    incRadius: number;
    radiusLimit: number;
    batchTime: number;
    acceptTime: number;
    batchSize: number;
    attemptLimit: number;
    tasks: number;
    radius: number;
    retryLimit: number;
    ride_type: number;
    put_agent_busy: number;
    jobAndFleetStatus: any;
    retry: number;
  };
  batchConfig: {
    broadcast_type: number;
    is_enabled: number;
    offline_agents: number;
    send_to_all_expires_in: number;
    expires_in: number;
    startingRadius: number;
    incRadius: number;
    radiusLimit: number;
    batchTime: number;
    acceptTime: number;
    batchSize: number;
    attemptLimit: number;
    tasks: number;
    radius: number;
    retryLimit: number;
    ride_type: number;
    put_agent_busy: number;
    jobAndFleetStatus: any;
    retry: number;
  };
  agent_offline_time: number;
  deliveries: {
    job_type: number;
    job_time: string;
    job_status: number;
    customer_username: string;
    job_address: string;
    job_latitude: number;
    job_longitude: number;
    job_delivery_datetime: string;
    customer_phone: string;
    is_return_task: number;
    is_package_insured: number;
    insurance_amount: number;
    upto_limit: number;
  }[];
  is_nexus: number;
  ride_type: number;
  delivery_instruction: string;
  loaders_count: number;
  delivery_images: string;
  sareaId: number;
  landmark: string;
  payment_method: number;
  created_by: number;
  order_id: number;
  customer_type: number;
  access_token: string;
  send_push_to_busy_fleets: number;
  is_cod_job: number;
  vehicle_id: number;
  busy_fleet_minutes: number;
  isSlaAdded: boolean;
  team_pool_config_enabled: number;
  attempt: number;
  job_lat: number;
  job_lng: number;
  start_date: string;
  start_date_origin: string;
  end_date: string;
  allFleets: any[];
  fleets_length: number;
  timeinseconds: number;
};

export type KwikCreateTaskSuccessResponse = {
  pickups: {
    job_id: number;
    job_hash: string;
    job_token: string;
    status: boolean;
    auto_assignment_data: AutoAssignmentData;
    order_id: number;
    result_tracking_link: string;
    new_agent_task_insertion_data: any[];
  }[];

  deliveries: {
    job_id: number;
    job_hash: string;
    job_token: string;
    status: boolean;
    auto_assignment_data: number;
    order_id: number;
    result_tracking_link: string;
    new_agent_task_insertion_data: {
      job_id: number;
      fleet_ids: any[];
      fleetNameAndNumber: any[];
      pickup_delivery_relationship: string;
      job_date: string;
      time_in_seconds: number;
      related_job_count: number;
      broadcast_type: number;
      insert_new_task: boolean;
    }[];
  }[];

  unique_order_id: string;
  job_status_check_link: string;
  contactUs: {
    email: string;
    phone_no: string;
  };
  cashback: number;
};

export type KwikVendorloginResponse = {
  access_token: string;
  app_access_token: string;
  vendor_details: {
    vendor_id: number;
    is_created_by_admin: number;
    first_name: string;
    last_name: string;
    email: string;
    phone_no: string;
    user_id: number;
  };
  fav_locations: {
    fav_id: number;
    address: string;
    // ... (other properties)
  }[];
  app_version: any[]; // You can provide a more specific type if needed
  formSettings: {
    form_id: number;
    form_type: number;
    form_name: string;
    // ... (other properties)
  }[];
  userOptions: {
    template: string;
    display_name: string;
    template_id: string;
    items: {
      label: string;
      display_name: string;
      data_type: string;
      app_side: string;
      required: number;
      value: number;
      data: number;
      input: number;
      template_id: string;
    }[];
    payment_formula: string;
    job_formulas: string[];
    extras: {
      req_popup: string[];
      invoice_html: string;
    };
  };
  deliveryOptions: {
    template: string;
    display_name: string;
    template_id: string;
    items: {
      label: string;
      display_name: string;
      data_type: string;
      app_side: string;
      required: number;
      value: number;
      data: number;
      input: number;
      template_id: string;
    }[];
    payment_formula: string;
    job_formulas: string[];
    extras: {
      req_popup: string[];
      invoice_html: string;
    };
  };
  active_task: any; // You can provide a more specific type if needed
  categories: any[]; // You can provide a more specific type if needed
  vendorPromos: {
    promos: any[]; // You can provide a more specific type if needed
    coupons: any[]; // You can provide a more specific type if needed
  };
  signup_template_name: string;
  signup_template_data: any[]; // You can provide a more specific type if needed
  vendor_signup_info: string;
  is_signup_info_editable: number;
  map: any; // You can provide a more specific type if needed
  paystack_key: string;
};

export enum OrderPaymentStatus {
  PENDING = "pending",
  PAID = "paid",
}

export enum OrderStatus {
  INITIATED = "initiated",
  PENDING = "pending",
  ACCEPTED = "accepted",
  REJECTED = "rejected",
  READYFORPICKUP = "ready_for_pickup",
  CANCELLED = "cancelled",
  DELIVERED = "delivered",
}

export interface DeliveryOrderInterface {
  user: number;
  price: number;
  status: string;
  returningCustomer?: boolean;
  paymentMethod?: string;
  paymentStatus?: OrderPaymentStatus;
  receiversName: string;
  receiversPhoneNumber: string;
  deliveryAddress: {
    latitude?: number;
    longitude?: number;
  };
  custom_field: {
    name: string;
    value: string;
  };
  deliveryAddressDescription: string;
  discountTotal?: number;
  totalDebit?: number;
  shop: string;
  cartItem: ICartItem;
  orderType: OrderType;
  transactionReference?: string;
}

export interface IDeliveryOrderInterface
  extends Document,
    DeliveryOrderInterface {}

export interface SelfPickupOrderInterface {
  user: number;
  price: number;
  status: string;
  paymentMethod?: string;
  paymentStatus?: OrderPaymentStatus;
  custom_field: {
    name: string;
    value: string;
  };
  pickUpDateTime: Date;
  discountTotal?: number;
  returningCustomer?: boolean;
  totalDebit?: number;
  shop: string;
  cartItem: ICartItem;
  orderType: OrderType;
  transactionReference?: mongoose.Types.ObjectId;
}

export interface ISelfPickupOrderInterface
  extends Document,
    SelfPickupOrderInterface {}
export interface IShopDeliveryDetails {
  shop: string;
  quantity: number;
  deliveryCost: number;
}

export interface OrderPaymentGroupInterface extends Document {
  user: number;
  orders: ISelfPickupOrderInterface[] | IDeliveryOrderInterface[];
  totalAmount: number;
  paymentStatus: OrderPaymentStatus;
  shopDeliveryDetails: [IShopDeliveryDetails];
  orderType: OrderType;
  transactionReference: string;
  deliveryMerchant?: string;
  deliveryAddressDescription?: string;
  deliveryAddress?: {
    latitude?: number;
    longitude?: number;
  };
  receiversName: string;
  receiversPhoneNumber: string;
  orderDeliveryDetails: string;
}

export interface IOrderGroup extends Document {
  user: mongoose.Types.ObjectId;
  shop: mongoose.Types.ObjectId;
  orders: string[];
  totalAmount: number;
  totalDeliveryFee: number;
  deliveryMerchant?: IDeliveryMerchant;
  deliveryAddressDescription?: string;
  receiversName: string;
  deliveryAddress: {
    latitude?: number;
    longitude?: number;
  };
  orderType: OrderType;
  receiversPhoneNumber: string;
  status: OrderStatus;
  deliveryStatus: OrderDeliveryStatus;
  orderDeliveryDetails: string;
}
export interface IDeliveryMerchant extends Document {
  name: string;
  description: string;
  email: string;
}

//["pending", "dispatched", "delivered"],
export enum OrderDeliveryStatus {
  PENDING = "pending",
  PACKAGING = "packaging",
  DISPATCHED = "dispatched",
  DELIVERED = "delivered",
}

export enum CartItemStatus {
  ACTIVE = "active",
  ORDERED = "ordered",
}

export interface TransactionDetailsItem {
  parentRef: string;
  itemName: string;
  shopName: string;
  amount: number;
  quantity: number;
  accountNo: string;
}

interface TransactionDetailsDto {
  transactionRef: string;
  // externalRef: string;
  // parentRef: string;
  // phone: string;
  // amount: number;
  description: string;
  // deviceId: string;
  // channel: string;
  fee: number;
  // customerUniqueIdentifier: number;
  // customFieldName?: string;
  // provider: string;
  // paymentItem: string;
  items: TransactionDetailsItem[];
}

export interface CheckoutInitiateTransaction {
  transactionType: string;
  transactionDetailsDto: TransactionDetailsDto;
}

export interface KwikWebhookResponse {
  task_id: number;
  unique_order_id: string;
  pickup_job_status: number;
  delivery_job_status: number;
}

export interface KwikResponse<T> {
  code: KwikResponseStatusCode;
  description: string;
  status: string;
  data?: T;
}

export enum KwikResponseStatusCode {
  SUCCESSFUL = "200",
  ERROR = "201",
}

export interface KwikWebhookResponse {
  task_id: number;
  unique_order_id: string;
  pickup_job_status: number;
  delivery_job_status: number;
}

export enum KwikTaskStatus {
  UPCOMING = 0,
  STARTED = 1,
  ENDED = 2,
  FAILED = 3,
  ARRIVED = 4,
  UNASSIGNED = 6,
  ACCEPTED = 7,
  DECLINED = 8,
}
export enum KwikStatusCode {
  PARAMETER_MISSING = 100,
  INVALID_KEY = 101,
  ACTION_COMPLETE = 200,
  SHOW_ERROR_MESSAGE = 201,
  ERROR_IN_EXECUTION = 404,
}

export interface KwikServiceResponse<T> {
  status: KwikStatusCode;
  message: string;
  data?: T;
}

let status: KwikTaskStatus = KwikTaskStatus.ACCEPTED;

export const KwikTaskStatusMap = {
  0: "UPCOMING",
  1: "STARTED",
  2: "ENDED",
  7: "ACCEPTED",
  3: "FAILED",
  4: "ARRIVED",
  6: "UNASSIGNED",
  8: "DECLINED",
};

console.log(KwikTaskStatusMap[7]);

export const KwikStatusInfoMapping = {
  UPCOMING: "The task has been assigned to a agent.",
  STARTED: "The task has been started and the agent is on the way.",
  ENDED: "The task has been completed successfully",
  FAILED: "The task has been completed unsuccessfully",
  ARRIVED:
    "The task is being performed and the agent has reached the destination.",
  UNASSIGNED: "The task has not been assigned to any agent.",
  ACCEPTED: "The task has been accepted by the agent which is assigned to him.",
  DECLINE: "The task has been declined by the agent which is assigned to him.",
  CANCEL: "The task has been cancelled by the agent which is accepted by him.",
  Deleted: "When the task is deleted from the Dashboard.",
};

export interface DellyManGetQuoteApiResponse {
  ResponseCode: number;
  ResponseMessage: string;
  Companies: Company[];
  RejectedCompanies: Record<string, unknown>;
  Products: Products;
  Distance: number;
}

interface Company {
  CompanyID: number;
  Name: string;
  TotalPrice: number;
  OriginalPrice: number;
  PayableAmount: number | null;
  SavedPrice: number;
  SameDayPrice: number | null;
  DeductablePrice: number;
  AvgRating: number;
  NumberOfOrders: number;
  NumberOfRating: number;
}

interface Products {
  TotalAmount: number;
  TotalCommission: number;
  TotalSettlement: number;
  ProductAmounts: ProductAmount[];
}

interface ProductAmount {
  Amount: number;
  Commission: number;
  Settlement: number;
}

export interface DellymanGetQuotesPayload {
  PaymentMode: string;
  Vehicle: string;
  IsInstantDelivery: number;
  PickupRequestedTime: string;
  PickupRequestedDate: string;
  PickupAddress: string;
  DeliveryAddress: string[];
}

export interface DellymanPackage {
  PackageDescription: string;
  DeliveryContactName: string;
  DeliveryContactNumber: string;
  DeliveryGooglePlaceAddress: string;
  DeliveryLandmark: string;
  PickUpCity: string;
  PickUpState: string;
  DeliveryCity: string;
  DeliveryState: string;
}

export interface DellyManBookOrderPayload {
  CompanyID: number;
  PaymentMode: string;
  Vehicle: string;
  PickUpContactName: string;
  PickUpContactNumber: string;
  PickUpLandmark: string;
  PickUpGooglePlaceAddress: string;
  IsInstantDelivery: string;
  IsProductOrder: number;
  PickUpRequestedTime: string;
  PickUpRequestedDate: string;
  DeliveryRequestedTime: string;
  DeliveryTimeline: string;
  OrderRef: string;
  Packages: DellymanPackage[];
}

interface Package {
  PackageID: number;
  PackageTrackingID: string;
}

export interface DellymanBookOrderApiResponse {
  ResponseCode: number;
  ResponseMessage: string;
  OrderID: number;
  OrderCode: string;
  TrackingID: string;
  Reference: string;
  Packages: {
    PackageID: number;
    PackageTrackingID: string;
  }[];
}

export interface DellymanWebhookResponse {
  status: boolean;
  message: string;
  order: DellymanOrder;
}

interface DellymanOrder {
  OrderID: number;
  OrderCode: string;
  CustomerID: number;
  CompanyID: number;
  TrackingID: number;
  OrderDate: string;
  OrderStatus:
    | DellymanOrderStatus.ASSIGNED
    | DellymanOrderStatus.COMPLETED
    | DellymanOrderStatus.CANCELLED
    | DellymanOrderStatus.INVALID
    | DellymanOrderStatus.ONHOLD
    | DellymanOrderStatus.PENDING
    | DellymanOrderStatus.REJECTED
    | DellymanOrderStatus.RETURNED
    | DellymanOrderStatus.REJECTION_REQUEST
    | DellymanOrderStatus.CANCEL_REQUEST
    | DellymanOrderStatus.INTRANSIT
    | DellymanOrderStatus.PARTIALLY_RETURNED;
  OrderPrice: number;
  AssignedAt: string;
  PickedUpAt: string;
  DeliveredAt: string;
  Note: string;
  Packages: {
    PackageID: string;
    PackageTrackingID: string;
    PackageStatus: string;
  }[];
}

export enum DellymanOrderStatus {
  PENDING = "PENDING",
  ASSIGNED = "ASSIGNED",
  INTRANSIT = "INTRANSIT",
  COMPLETED = "COMPLETED",
  RETURNED = "RETURNED",
  CANCELLED = "CANCELLED",
  ONHOLD = "ONHOLD",
  REJECTED = "REJECTED",
  REJECTION_REQUEST = "REJECTION-REQUEST",
  CANCEL_REQUEST = "CANCEL-REQUEST",
  INVALID = "INVALID",
  PARTIALLY_RETURNED = "PARTIALLY-RETURNED",
}
