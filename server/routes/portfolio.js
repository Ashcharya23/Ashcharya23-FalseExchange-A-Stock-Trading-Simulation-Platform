import express from "express";
import PortfolioItem from "../models/PortfolioItem.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// ✅ Get user's portfolio
router.get("/", authMiddleware, async (req, res) => {
  const portfolio = await PortfolioItem.find({ user: req.userId });
  res.json({ portfolio });
});

export default router;
