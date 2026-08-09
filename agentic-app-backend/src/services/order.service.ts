import { ORDERS } from "../data/orders.data.ts";
import CustomerService from "./customer.service.ts";

export default class OrderService {
    static async getLatestOrders(limit?: number) {
        const sortedOrders = ORDERS.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
        if (limit && limit > 0) {
            return sortedOrders.slice(0, limit);
        }
        return sortedOrders;
    }

    static async getOrderById(id: string) {
        return ORDERS.find((order) => order._id === id) || null;
    }

    static async getLatestOrdersWithCustomerDetails(limit?: number) {
        const customers = await CustomerService.getLatestCustomers(); // no limit, return all customers
        const orders_data = await this.getLatestOrders();
        const orders = ORDERS.map((order) => {
            const customer = customers.find((c) => c._id === order.customerId);
            return { ...order, customer:customer?.name}
        });
        let sortedOrders = orders.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
        if (limit && limit > 0) {
            return sortedOrders.slice(0, limit);
        }
        return sortedOrders;
    }
}