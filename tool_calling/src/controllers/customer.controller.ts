import { CUSTOMERS } from "../data/customer.data.ts";
import type { Request, Response } from "express";
import CustomerService from "../services/customer.service.ts";

export default class CustomerController {
    static async getAllCustomers(req: Request, res: Response) {
        try {
            const { limit } = req.query;
            const customers = await CustomerService.getLatestCustomers(limit ? Number(limit) : undefined);
            return res.json({ success: true, customers });
        }
        catch (error: any) {
            console.error("Error getting all customers:", error)
            return res.status(500).json({ success: false, error: error.message });
        }
    }

    static async getCustomerById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const customer = await CustomerService.getCustomerById(id as string);
            return res.json({ success: true, customer });
        }
        catch (error: any) {
            console.error("Error getting customer by id:", error)
            return res.status(500).json({ success: false, error: error.message });
        }
    }
}