import mongoose from "mongoose";

const PortfolioItemSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  security: { type: String, required: true },
  quantity: { type: Number, required: true }
});

export default mongoose.model("PortfolioItem", PortfolioItemSchema);