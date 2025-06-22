import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  security: { type: String, required: true },
  quantity: { type: Number, required: true },
  executedQty: { type: Number, default: 0 },
  status: { type: String, enum: ["pending", "executed", "cancelled"], default: "pending" },
}, { timestamps: true });

export default mongoose.model("Order", OrderSchema);
