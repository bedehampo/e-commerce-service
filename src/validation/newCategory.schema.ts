import { object, string, array, TypeOf, z } from "zod";

const subCategorySchema = object({
	name: string({
		required_error: "Subcategory Name is required",
	}),
});

const variationSchema = object({
	properties: object({
		title: string({
			required_error: "Variation Title is required",
		}),
		value: string({
			required_error: "Variation Value is required",
		}),
	}),
});

export const newCategorySchema = object({
	name: string({
		required_error: "Category Name is required",
	}),
	subCategories: array(subCategorySchema).min(
		1,
		"Select at least one subcategory"
	),
	variations: array(variationSchema),
});

export type NewCategoryInput = TypeOf<
	typeof newCategorySchema
>;
