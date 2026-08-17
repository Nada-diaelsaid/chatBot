import { CUSTOMERS } from "../data/customer.data.ts";

export default class CustomerService {
    static async getLatestCustomers(limit?: number) {
        const sortedCustomers = CUSTOMERS.sort((a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime());
        if (limit && limit > 0) {
            return sortedCustomers.slice(0, limit);
        }
        return sortedCustomers;
    }

    static async getCustomerById(id: string) {
        return CUSTOMERS.find((customer) => customer._id === id) || null;
    }
}