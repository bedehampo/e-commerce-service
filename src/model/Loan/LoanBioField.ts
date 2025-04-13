import mongoose, { Schema } from "mongoose";
import slugify from "slugify";

type FieldType =
	| "text"
	| "number"
	| "date"
	| "select"
	| "radio"
	| "checkbox"
	| "file";

export enum LoanBioFieldType {
	TEXT = "text",
	NUMBER = "number",
	DATE = "date",
	SELECT = "select",
	RADIO = "radio",
	CHECKBOX = "checkbox",
	FILE = "file",
}

const LoanBioField = new mongoose.Schema(
	{
		title: {
			type: String,
			required: true,
			unique: true,
		},
		key: {
			type: String,
			required: true,
			unique: true,
		},
		type: {
			type: String,
			required: true,
			enum: [
				LoanBioFieldType.TEXT,
				LoanBioFieldType.NUMBER,
				LoanBioFieldType.DATE,
				LoanBioFieldType.SELECT,
				LoanBioFieldType.RADIO,
				LoanBioFieldType.CHECKBOX,
				LoanBioFieldType.FILE,
			],
		},
		options: {
			type: [String],
			required: false,
		},
	},
	{
		timestamps: true,
		collection: "loan_bio_fields",
	}
);

// slugify the title and set it to the key before validation
LoanBioField.pre("validate", function (next) {
	if (this.isModified("title")) {
		this.set(
			"key",
			slugify(this.get("title"), { lower: true })
		);
	}
	next();
});

export default mongoose.model("loanbiofield", LoanBioField);
