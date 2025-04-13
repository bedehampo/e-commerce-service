interface ProductColor {
	_id: string;
	name: string;
	hexCode: string;
}

interface ProductImage {
	color: ProductColor;
	images: string[];
	_id: string;
}

interface State {
	_id: string;
	name: string;
}

interface Shop {
	_id: string;
	brand_name: string;
	official_email: string;
	state: State;
}

interface Wholesale {
	quantity: number;
	price: number;
	_id: string;
}

interface Variation {
	name: string;
	values: string[];
	_id: string;
}

interface Product {
	_id: string;
	productImages: ProductImage[];
	shop: Shop | null; // Shop could be null if not associated with a shop
	productCategory: string;
	productShopCategory: string;
	productDescription: string;
	keyFeature: string;
	productName: string;
	actualPrice: number;
	sales: boolean;
	discountRate: number;
	discountAmount: number;
	productPrice: number;
	stockQuantity: number;
	quantitySold: number;
	wholeSale: Wholesale[];
	cashBackPercentage: number;
	userVisits: any[]; // Define type based on actual usage
	tags: any[]; // Define type based on actual usage
	status: string;
	views: any[]; // Define type based on actual usage
	popularityScore: number;
	reviews: any[]; // Define type based on actual usage
	variations: Variation[];
	customFields: any[]; // Define type based on actual usage
	deliveryCoverage: "state" | "nationwide";
	shopActions: any[]; // Define type based on actual usage
	createdAt: string; // Date string
	updatedAt: string; // Date string
	__v: number;
}

export interface ProductsResponse {
	status: string;
	message: string;
	data: Product[];
}
