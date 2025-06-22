import readline from "readline";
import express from "express";
import Order from "../models/Order.js";
import PortfolioItem from "../models/PortfolioItem.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// 🔹 Get user's orders
router.get("/my-orders", authMiddleware, async (req, res) => {
  const orders = await Order.find({ user: req.userId }).sort({ createdAt: -1 });
  res.json({ orders });
});

// 🔹 Place new order
router.post("/place", authMiddleware, async (req, res) => {
  const { security, quantity } = req.body;
  if (!security || !quantity) return res.status(400).json({ msg: "Missing data" });

  const order = await Order.create({
    user: req.userId,
    security,
    quantity,
    status: "pending",
    executedQty: 0,
  });

  res.status(201).json({ msg: "Order placed", order });
});

// 🔹 Amend order
router.patch("/amend/:id", authMiddleware, async (req, res) => {
  const { quantity } = req.body;
  if (!quantity || quantity <= 0) return res.status(400).json({ msg: "Invalid quantity" });

  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.userId });
    if (!order) return res.status(404).json({ msg: "Order not found" });
    if (order.status !== "pending") return res.status(400).json({ msg: "Only pending orders can be amended" });

    order.quantity = quantity;
    await order.save();
    res.json({ msg: "Order updated", order });
  } catch (err) {
    res.status(500).json({ msg: "Server error", err });
  }
});

// 🔹 Cancel order
router.patch("/cancel/:id", authMiddleware, async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.userId });
    if (!order) return res.status(404).json({ msg: "Order not found" });
    if (order.status !== "pending") return res.status(400).json({ msg: "Only pending orders can be cancelled" });

    order.status = "cancelled";
    await order.save();
    res.json({ msg: "Order cancelled", order });
  } catch (err) {
    res.status(500).json({ msg: "Server error", err });
  }
});


// 🔹 Request server execution – returns order details
router.get("/request-execution/:id", authMiddleware, async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.userId });
    if (!order) return res.status(404).json({ msg: "Order not found" });

    if (order.status === "executed" || order.status === "cancelled") {
      return res.status(400).json({ msg: "Order is already completed or cancelled" });
    }

    res.json({
      msg: "Ready to execute. Provide quantity to execute.",
      order,
    });
  } catch (err) {
    res.status(500).json({ msg: "Server error", err });
  }
});


// 🔹 Execute part/all of the order
router.patch("/execute/:id", authMiddleware, async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.userId });

    if (!order) return res.status(404).json({ msg: "Order not found" });
    if (order.status === "executed")
      return res.status(400).json({ msg: "Order already executed" });

    const remainingQty = order.quantity - order.executedQty;
    if (remainingQty <= 0)
      return res.status(400).json({ msg: "Nothing left to execute" });

    console.log(`\n💡 Server Execution Request for Order ID: ${order._id}`);
    console.log(`User: ${req.userId}`);
    console.log(`Security: ${order.security}`);
    console.log(`Total Quantity: ${order.quantity}`);
    console.log(`Executed So Far: ${order.executedQty}`);
    console.log(`Remaining to Execute: ${remainingQty}`);

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question(`How many units would you like to execute (max ${remainingQty})? `, async (answer) => {
      const executeQty = parseInt(answer);

      if (isNaN(executeQty) || executeQty <= 0 || executeQty > remainingQty) {
        console.log("❌ Invalid quantity. Aborting execution.");
        rl.close();
        return res.status(400).json({ msg: "Invalid quantity" });
      }

      // Update order
      order.executedQty += executeQty;
      if (order.executedQty === order.quantity) {
        order.status = "executed";
      }
      await order.save();

      // Update portfolio
      const existingItem = await PortfolioItem.findOne({
        user: req.userId,
        security: order.security,
      });

      if (existingItem) {
        existingItem.quantity += executeQty;
        await existingItem.save();
      } else {
        await PortfolioItem.create({
          user: req.userId,
          security: order.security,
          quantity: executeQty,
        });
      }

      rl.close();
      console.log(`✅ Executed ${executeQty} units. Order status: ${order.status}`);
      return res.json({ msg: `Executed ${executeQty} units`, order });
    });
  } catch (err) {
    console.error("❌ Server error:", err);
    res.status(500).json({ msg: "Server error", err });
  }
});

export default router;
