import { ORDERS } from "../data/orders.data.ts";
import type { Request, Response } from "express";
import OrderService from "../services/order.service.ts";

export default class OrderController {
    static async getAllOrders(req: Request, res: Response) {
        try {
            const { limit } = req.query;
            const orders = await OrderService.getLatestOrders(limit ? Number(limit) : undefined);
            return res.json({ success: true, orders });
        }
        catch (error: any) {
            console.error("Error getting all orders:", error)
            return res.status(500).json({ success: false, error: error.message });
        }
    }

    static async getOrderById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const order = await OrderService.getOrderById(id as string);
            if (!order) {
                return res.status(404).json({ success: false, error: 'Order not found' });
            }
            return res.json({ success: true, order });
        }
        catch (error: any) {
            console.error("Error getting order by id:", error)
            return res.status(500).json({ success: false, error: error.message });
        }
    }
}