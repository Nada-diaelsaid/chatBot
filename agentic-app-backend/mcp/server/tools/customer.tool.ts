import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod/v4'; // Will use it for data validation
import CustomerService from "../../../src/services/customer.service.ts";

// This function is registering multiple tools.
export function registerCustomerTools(mcpServer: McpServer)
{
    console.log("Registering Customer tool...");
    
    // see: https://github.com/modelcontextprotocol/typescript-sdk
    // Tool #1: getCustomers
    mcpServer.registerTool(
        "getCustomers",
        {
            description: "Get all customers from JSON data based on a limit",
            inputSchema: 
            {
                 limit: z.number().optional(),
            },
            outputSchema:
            {
                // Return customer as array of objects
                customers: z.array(z.object({
                    _id: z.string(),
                    name: z.string(),
                    email: z.string(),
                    joinedAt: z.string().optional(),
                })),
            },
        },
        async ({limit}) => {
            console.log("Getting customers...", limit);
            const customers = await CustomerService.getLatestCustomers(limit);
            /// return has to follow certain schema

            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify(customers, null, 2),
                }],
                // must add curly vbraces around customers
                structuredContent: { customers },
            }; 
        },
    );

    // Tool #2: getCustomerById
    mcpServer.registerTool(
        // Tool name which AI model will use to call this tool
        "getCustomerById",
        {
            description: "Get a customer by id from JSON data",
            inputSchema:
            {
                id: z.string(),
            },
            outputSchema:
            {
                // Return customer as object
                customer: z.object({
                    _id: z.string(),
                    name: z.string(),
                    email: z.string(),
                    joinedAt: z.string().optional(),
                }),
            },

        },
        async ({id}) => {
            console.log("Getting customer by id...", id);
            const customer = await CustomerService.getCustomerById(id);
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify(customer, null, 2),
                }],
                structuredContent: { customer },
            };
        },
    );
}