import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod/v4'; // Will use it for data validation
import OrderService from "../../../src/services/order.service.ts";

// Shared shape describing an order item, matching src/data/orders.data.ts
const orderItemSchema = z.object({
    _id: z.string(),
    name: z.string(),
    quantity: z.number(),
    price: z.number(),
});

// Shared shape describing an order, matching src/data/orders.data.ts
// (must include every field the underlying data actually has, otherwise
// output validation fails with "must NOT have additional properties").
const orderSchema = z.object({
    _id: z.string(),
    customerId: z.string(),
    orderDate: z.string(),
    totalAmount: z.number(),
    status: z.string(),
    items: z.array(orderItemSchema),
});

// This function is registering multiple tools.
export function registerOrderTools(mcpServer: McpServer)
{
    console.log("Registering Order tool...");
    // Tool #1: getOrders
    mcpServer.registerTool(
        "getOrders",
        {
            description: "Get all orders from JSON data based on a limit",
            inputSchema: 
            {
                limit: z.number().optional(),
            },
            outputSchema:
                {
                    orders: z.array(orderSchema),
                },
        },
        async ({limit}) => {
            console.log("Getting orders...", limit);
            const orders = await OrderService.getLatestOrders(limit);
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify(orders, null, 2),
                }],
                structuredContent: { orders },
            };
        },
    );

    // Tool #2: getOrderById
    mcpServer.registerTool(
        "getOrderById",
        {
            description: "Get an order by id from JSON data",
            inputSchema: 
            {
                id: z.string()
            },
            outputSchema: 
            {
                order: orderSchema,
            },
        },
        async ({id}) => {
            console.log("Getting order by id...", id);
            const order = await OrderService.getOrderById(id);
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify(order, null, 2),
                }],
                structuredContent: { order },
            };
        },
    );

    // Tool #3: getLatestOrdersWithCustomerDetails
    mcpServer.registerTool(
        "getLatestOrdersWithCustomerDetails",
        {
            description: "Get the latest orders with customer details from JSON data based on a limit (only name with optional limit)",
            inputSchema: 
            {
                limit: z.number().optional(),
            },
            outputSchema: 
            {
                orders: z.array(orderSchema.extend({ customer: z.string().optional() })),
            },
        },
        
        async ({limit}) => {
            console.log("Getting latest orders with customer details...", limit);
            const orders = await OrderService.getLatestOrdersWithCustomerDetails(limit);
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify(orders, null, 2),
                }],
                structuredContent: { orders },
            };
        },
    );
}