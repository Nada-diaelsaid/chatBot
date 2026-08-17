import express from "express";
import OrderController from "../controllers/order.controller.ts";

const router = express.Router();

router.get('/orders', OrderController.getAllOrders);
router.get('/orders/:id', OrderController.getOrderById);

export default router;