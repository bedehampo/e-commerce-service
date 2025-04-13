import mongoose from "mongoose";

const CounterSchema = new mongoose.Schema({
	_id: { type: String, required: true }, // The name of the counter (e.g., 'orderGroup')
	sequence_value: { type: Number, default: 0 },
});

export const Counter = mongoose.model(
	"counter",
	CounterSchema
);
