import {
	object,
	string,
	number,
	array,
	TypeOf,
	boolean,
	any,
} from "zod";

const payload = {
	body: object({
		shopId: string({
			required_error: "Shop id is required",
			invalid_type_error: "shop id must be a string",
		}),
		productImages: array(
			object({
				color: string({
					invalid_type_error:
						"image color must be a string",
					required_error: "image color is required",
				}),
				images: array(
					string({
						invalid_type_error:
							"the individual images must be a string",
						required_error: "a single image is required",
					}),
					{
						invalid_type_error: "images must be an array",
						required_error: "images is required",
					}
				),
				quantity: number({
					invalid_type_error: "quantity must be a number",
					required_error: "quantity is required",
				}),
			})
		),
		productCategory: string({
			required_error: "Product category is required",
			invalid_type_error:
				"Product category must be a string",
		}),
		productDescription: string({
			required_error: "Product description is required",
			invalid_type_error:
				"Product description must be a string",
		}),
		keyFeature: string({
			invalid_type_error: "keyFeature must be a string",
		}).optional(),
		productName: string({
			required_error: "Product name is required",
			invalid_type_error: "Product name must be a string",
		}),
		actualPrice: number({
			required_error:
				"Actual price is required, path: actualPrice",
		}),
		discountAmount: number({
			required_error: "discount amount is required",
		}).optional(),
		sales: boolean({
			required_error: "On discount is required",
			invalid_type_error: "On discount must be a boolean",
		}).optional(),
		// stockQuantity: number({
		// 	invalid_type_error: "Stock quantity must be a number",
		// 	required_error: "Stock quantity is required",
		// }).optional(),
		wholeSale: array(
			object({
				quantity: number(),
				price: number(),
			})
				.refine((data) => {
					if (Number(data.quantity)) {
						return true;
					}
					return false;
				}, "Wholesale quantity must be a valid number")
				.refine((data) => {
					if (Number(data.price)) {
						return true;
					}
					return false;
				}, "Wholesale price must be a valid number")
		).optional(),
		tags: array(
			string({
				invalid_type_error:
					"Tag must be a string or id string",
			})
		).optional(),
		variations: array(
			object({
				name: string({
					invalid_type_error:
						"Variation id must be a string",
				}),
				values: array(
					string({
						invalid_type_error:
							"Variation value must be a string",
					})
				),
			})
		).optional(),
		properties: array(
			object({
				name: string({
					invalid_type_error:
						"property id must be a string",
				}),
				value: string({
					invalid_type_error:
						"property value must be a string",
				}),
			})
		).optional(),
		customFields: array(
			object({
				name: string({
					invalid_type_error:
						"custom name must be a string",
					required_error: "Custom name is required",
				}),
				value: string({
					invalid_type_error:
						"custom value must be a string",
					required_error: "Custom value is required",
				}),
			})
		).optional(),
		deliveryCoverage: string({
			invalid_type_error:
				"delivery coverage must be a string",
			required_error: "delivery coverage is required",
		}),
	})
		.refine((data) => {
			//if order type is self pickup then deliveryDateTime is required
			if (Number(data.actualPrice)) {
				return true;
			}
			return false;
		}, "Actual price must be a valid number")
		// .refine((data) => {
		// 	//if order type is self pickup then deliveryDateTime is required
		// 	if (Number(data.discountAmount)) {
		// 		return true;
		// 	}
		// 	return false;
		// }, "Discount amount must be a valid number")
		// .refine((data) => {
		// 	//if order type is self pickup then deliveryDateTime is required
		// 	if (Number(data.stockQuantity)) {
		// 		return true;
		// 	}
		// 	return false;
		// }, "Stock quantity must be a valid number")
		.refine((data) => {
			//if order type is self pickup then deliveryDateTime is required
			if (
				Number(data.actualPrice) >
				Number(data.discountAmount)
			) {
				return true;
			}
			return false;
		}, "Product price must be greater than discount amount"),
};

export const UploadProductSchema = object({
	...payload,
});

export type UploadProductInput = TypeOf<
	typeof UploadProductSchema
>;

const editPayload = {
	body: object({
		productId: string({
			required_error: "Product id is required",
			invalid_type_error: "Product id must be a string",
		}),
		productImages: array(
			object({
				color: string({
					invalid_type_error:
						"image color must be a string",
					required_error: "image color is required",
				}),
				images: array(
					string({
						invalid_type_error:
							"the individual images must be a string",
						required_error: "a single image is required",
					}),
					{
						invalid_type_error: "images must be an array",
						required_error: "images is required",
					}
				),
			})
		),
		productCategory: string({
			required_error: "Product category is required",
			invalid_type_error:
				"Product category must be a string",
		}),
		productDescription: string({
			required_error: "Product description is required",
			invalid_type_error:
				"Product description must be a string",
		}),
		keyFeature: string({
			invalid_type_error: "keyFeature must be a string",
		}).optional(),
		productName: string({
			required_error: "Product name is required",
			invalid_type_error: "Product name must be a string",
		}),
		actualPrice: number({
			required_error:
				"Actual price is required, path: actualPrice",
		}),
		discountAmount: number({
			required_error: "discount amount is required",
		}).optional(),
		sales: boolean({
			required_error: "On discount is required",
			invalid_type_error: "On discount must be a boolean",
		}).optional(),
		// stockQuantity: number({
		// 	invalid_type_error: "Stock quantity must be a number",
		// 	required_error: "Stock quantity is required",
		// }).optional(),
		wholeSale: array(
			object({
				quantity: number(),
				price: number(),
			})
				.refine((data) => {
					if (Number(data.quantity)) {
						return true;
					}
					return false;
				}, "Wholesale quantity must be a valid number")
				.refine((data) => {
					if (Number(data.price)) {
						return true;
					}
					return false;
				}, "Wholesale price must be a valid number")
		).optional(),
		tags: array(
			string({
				invalid_type_error:
					"Tag must be a string or id string",
			})
		).optional(),
		variations: array(
			object({
				name: string({
					invalid_type_error:
						"Variation id must be a string",
				}),
				values: array(
					string({
						invalid_type_error:
							"Variation value must be a string",
					})
				),
			})
		).optional(),
		properties: array(
			object({
				name: string({
					invalid_type_error:
						"property id must be a string",
				}),
				value: string({
					invalid_type_error:
						"property value must be a string",
				}),
			})
		).optional(),
		customFields: array(
			object({
				name: string({
					invalid_type_error:
						"custom name must be a string",
					required_error: "Custom name is required",
				}),
				value: string({
					invalid_type_error:
						"custom value must be a string",
					required_error: "Custom value is required",
				}),
			})
		).optional(),
		deliveryCoverage: string({
			invalid_type_error:
				"delivery coverage must be a string",
			required_error: "delivery coverage is required",
		}),
	})
		.refine((data) => {
			//if order type is self pickup then deliveryDateTime is required
			if (Number(data.actualPrice)) {
				return true;
			}
			return false;
		}, "Actual price must be a valid number")
		// .refine((data) => {
		// 	//if order type is self pickup then deliveryDateTime is required
		// 	if (Number(data.discountAmount)) {
		// 		return true;
		// 	}
		// 	return false;
		// }, "Discount amount must be a valid number")
		// .refine((data) => {
		// 	//if order type is self pickup then deliveryDateTime is required
		// 	if (Number(data.stockQuantity)) {
		// 		return true;
		// 	}
		// 	return false;
		// }, "Stock quantity must be a valid number")
		.refine((data) => {
			//if order type is self pickup then deliveryDateTime is required
			if (
				Number(data.actualPrice) >
				Number(data.discountAmount)
			) {
				return true;
			}
			return false;
		}, "Product price must be greater than discount amount"),
};

export const EditProductSchema = object({
	...editPayload,
});

export type EditProductInput = TypeOf<
	typeof EditProductSchema
>;

const deleteWholesale = {
	body: object({
		productId: string({
			invalid_type_error: "Product id must be a string",
			required_error: "product id is requires",
		}),
		wholesaleId: string({
			invalid_type_error: "Product id must be a string",
			required_error: "product id is requires",
		}),
	}),
};

export const DeleteWholesaleSchema = object({
	...deleteWholesale,
});

export type DeleteWholesaleInput = TypeOf<
	typeof DeleteWholesaleSchema
>;

const stockUp = {
	body: object({
		productId: string({
			invalid_type_error: "Product id must be a string",
			required_error: "product id is requires",
		}),
		stockQuantity: number({
			invalid_type_error: "stock quantity must be a number",
			required_error: "stock quantity is requires",
		}),
	}),
};

export const StockUpSchema = object({
	...stockUp,
});

export type StockUpInput = TypeOf<typeof StockUpSchema>;
// New updates
const stockUpNew = {
	body: object({
		productId: string({
			invalid_type_error: "Product id must be a string",
			required_error: "Product id is required",
		}),
		stockUpdates: array(
			object({
				colorId: string({
					invalid_type_error: "Color id must be a string",
					required_error: "Color id is required",
				}),
				stockQuantity: number({
					invalid_type_error:
						"Stock quantity must be a number",
					required_error: "Stock quantity is required",
				}),
			})
		).nonempty({
			message: "At least one stock update is required.",
		}),
	}),
};

export const StockUpNewSchema = object({
	...stockUpNew,
});

export type StockUpNewInput = TypeOf<typeof StockUpNewSchema>;

const filterProductParams = {
	params: object({
		search: string({
			invalid_type_error: "Search must be a string",
		}).optional(),
		category: string({
			invalid_type_error: "Category must be a string",
		}).optional(),
		min_price: number({
			invalid_type_error: "Min price must be a number",
		}).optional(),
		max_price: number({
			invalid_type_error: "Max price must be a number",
		}).optional(),
		state: string({
			invalid_type_error: "State must be a string",
		}).optional(),
		rating: number({
			invalid_type_error: "Rating must be a number",
		}),
		per_page: number({
			invalid_type_error: "Per page must be a number",
		}).optional(),
		page: number({
			invalid_type_error: "Page must be a number",
		}).optional(),
		brand: string({
			invalid_type_error: "Brand must be a string",
		}).optional(),
		sub_category: string({
			invalid_type_error: "Sub category must be a string",
		}).optional(),
	}),
};

export const FilterProductSchema = object({
	...filterProductParams,
});

export type FilterProductInput = TypeOf<
	typeof FilterProductSchema
>;

const viewProductParams = {
	params: object({
		productId: string({
			invalid_type_error: "Product id must be a string",
		}),
	}),
};

export const ViewProductSchema = object({
	...viewProductParams,
});

export type ViewProductInput = TypeOf<
	typeof ViewProductSchema
>;

export const reviewProductParams = {
	body: object({
		productId: string({
			invalid_type_error: "Product id must be a string",
		}),
		rating: number({
			invalid_type_error: "Rating must be a number",
		})
			.max(5, "Rating must be less than or equal to 5")
			.min(1, "Rating must be greater than or equal to 1"),
		review: string({
			invalid_type_error: "Review must be a string",
		}).optional(),
	}),
};

export const ReviewProductSchema = object({
	...reviewProductParams,
});

export type ReviewProductInput = TypeOf<
	typeof ReviewProductSchema
>;

export const generateProductDescParams = {
	body: object({
		productName: string({
			invalid_type_error: "Product must be a string",
			required_error: "Product name is required",
		}),
		productCategory: string({
			invalid_type_error: "Shop category be a string",
			required_error: "Shop category is required",
		}),
		productSubcategory: string({
			invalid_type_error: "product subcategory be a string",
			required_error: "product subcategory is required",
		}),
		productBrand: string().optional(),
	}),
};

export const GenerateProductDescSchema = object({
	...generateProductDescParams,
});

export type GenerateProductDescInput = TypeOf<
	typeof GenerateProductDescSchema
>;

export const generateProductDescParams2 = {
	body: object({
		productName: string({
			invalid_type_error: "Product must be a string",
			required_error: "Product name is required",
		}),
		shopCategoryId: string({
			invalid_type_error: "Shop category be a string",
			required_error: "Shop category is required",
		}),
		productCategoryId: string({
			invalid_type_error: "product subcategory be a string",
			required_error: "product subcategory is required",
		}),
		productBrand: string().optional(),
	}),
};

export const GenerateProductDescSchema2 = object({
	...generateProductDescParams2,
});

export type GenerateProductDescInput2 = TypeOf<
	typeof GenerateProductDescSchema2
>;

export const approveProductPayload = {
	params: object({
		productId: string({
			invalid_type_error: "Product must be a string",
			required_error: "Product name is required",
		}),
	}),
};

export const approveProductSchema = object({
	...approveProductPayload,
});

export type ApproveProductInput = TypeOf<
	typeof approveProductSchema
>;

export const declineProductPayload = {
	body: object({
		description: string({
			invalid_type_error:
				"Product description must be a string",
			required_error: "Product description is required",
		}),
	}),
	params: object({
		productId: string({
			invalid_type_error: "Product must be a string",
			required_error: "Product name is required",
		}),
	}),
};

export const declineProductSchema = object({
	...declineProductPayload,
});

export type DeclineProductInput = TypeOf<
	typeof declineProductSchema
>;

const nearByProductsPayload = {
	body: object({
		location: object({
			latitude: number({
				required_error: "Latitude is required",
			}),
			longitude: number({
				required_error: "Longitude is required",
			}),
		}).optional(),
	}),
};

export const NearByProductsSchema = object({
	...nearByProductsPayload,
});

export type NearByProductsInput = TypeOf<
	typeof NearByProductsSchema
>;

const deliveryTimePayload = {
	body: object({
		state: string({
			required_error: "state name is required",
			invalid_type_error: "state name must be a string",
		}),
		productId: string({
			required_error: "product id is required",
			invalid_type_error: "product id must be a string",
		}),
	}),
};

export const DeliveryTimeSchema = object({
	...deliveryTimePayload,
});

export type DeliveryTimeInput = TypeOf<
	typeof DeliveryTimeSchema
>;

const returnProduct = {
	body: object({
		orderId: string({
			invalid_type_error: "order id must be a string",
			required_error: "order id is required",
		}),
		name: string({
			invalid_type_error: "username must be a string",
			required_error: "username is required",
		}),
		phoneNumber: string({
			invalid_type_error: "phone number must be a string",
			required_error: "phone number is required",
		}),
		pickUPChoice: string({
			invalid_type_error: "pick up choice must be a string",
			required_error: "pick up choice is required",
		}),
		address: string({
			invalid_type_error: "address must be a string",
			required_error: "address is required",
		}),
		reason: string({
			invalid_type_error: "reason must be a string",
			required_error: "reason is required",
		}),
	}),
};

export const ReturnProductSchema = object({
	...returnProduct,
});

export type ReturnProductInput = TypeOf<
	typeof ReturnProductSchema
>;

const updateReportProduct = {
	body: object({
		orderId: string({
			invalid_type_error: "order id must be a string",
		}).optional(),
		name: string({
			invalid_type_error: "username must be a string",
		}).optional(),
		phoneNumber: string({
			invalid_type_error: "phone number must be a string",
		}).optional(),
		pickUPChoice: string({
			invalid_type_error: "pick up choice must be a string",
		}).optional(),
		address: string({
			invalid_type_error: "address must be a string",
		}).optional(),
		reason: string({
			invalid_type_error: "reason must be a string",
		}).optional(),
	}),
};

export const UpdateReturnProductSchema = object({
	...updateReportProduct,
});

export type UpdateReturnProductInput = TypeOf<
	typeof UpdateReturnProductSchema
>;

// validate adminProductListingSectionCreation
const adminCreateProductDealCatPayload = {
	body: object({
		dealName: string({
			invalid_type_error:
				"product deal name must be a string",
			required_error: "product deal name is required",
		}),
		categoryId: string({
			invalid_type_error: "category id must be a string",
			required_error: "category is required",
		}),
		subCategories: array(
			object({
				subCategoryId: string({
					invalid_type_error:
						"sub-category id must be a string",
					required_error: "sub-category is required",
				}),
				image: string({
					invalid_type_error: "image must be a string",
					required_error: "image is required",
				}),
			})
		),
	}),
};

export const AdminCreateProductDealCatSchema = object({
	...adminCreateProductDealCatPayload,
});

export type AdminCreateProductDealCatInput = TypeOf<
	typeof AdminCreateProductDealCatSchema
>;

const adminUpdateProductDealCatPayload = {
	body: object({
		dealName: string({
			invalid_type_error:
				"product deal name must be a string",
			required_error: "product deal name is required",
		}).optional(),
		categoryId: string({
			invalid_type_error: "category id must be a string",
		}).optional(),
		subCategories: array(
			object({
				subCategoryId: string({
					invalid_type_error:
						"sub-category id must be a string",
				}).optional(),
				image: string({
					invalid_type_error: "image must be a string",
				}).optional(),
			})
		),
	}),
};

export const AdminUpdateProductDealCatSchema = object({
	...adminUpdateProductDealCatPayload,
});

export type AdminUpdateProductDealCatInput = TypeOf<
	typeof AdminUpdateProductDealCatSchema
>;

const plpBanner = {
	body: object({
		banner: string({
			invalid_type_error: "banner must be a string",
			required_error: "banner is required",
		}),
		description: string({
			invalid_type_error: "description must be a string",
			required_error: "description is required",
		}),
		products: array(
			string({
				invalid_type_error: "product id must be a string",
				required_error:
					"At least one product id is required",
			})
		),
	}),
};

export const PLPBannerSchema = object({
	...plpBanner,
});

export type PLPBannerInput = TypeOf<typeof PLPBannerSchema>;

const requestProductPayload = {
	body: object({
		productName: string({
			invalid_type_error: "product name must be a string",
			required_error: "product name is required",
		}),
		brandName: string({
			invalid_type_error: "brand name must be a string",
		}).optional(),
		duration: string({
			invalid_type_error: "duration must be a string",
			required_error: "duration is required",
		}),
		location: string({
			invalid_type_error: "location must be a string",
		}).optional(),
		moreInfo: string({
			invalid_type_error:
				"more information must be a string",
			required_error: "more information is required",
		}),
		document: string({
			invalid_type_error: "reason must be a string",
		}).optional(),
	}),
};

export const RequestProductSchema = object({
	...requestProductPayload,
});

export type RequestProductInput = TypeOf<
	typeof RequestProductSchema
>;
