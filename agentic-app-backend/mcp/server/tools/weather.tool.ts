import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod/v4";
import WeatherService from "../../../src/services/weather.service.ts";

// tool #1: Get live weather by city or region...
export function registerWeatherTools(mcpServer: McpServer)
{
    console.log("Registering Weather tool...");

    mcpServer.registerTool(
        "getWeather",
        {
            description: "Get live weather for a given location",
            inputSchema: 
            {
                city: z.string(),
                country: z.string().optional(),
            },
            outputSchema: 
            {
                // It pass lots of data (temp, pressure, humidity..etc), so we use any
                response: z.any(),
            },
        },
        async ({city, country}) => {
            console.log("Getting weather for...", city, country);
            // prepare the input
            const query = country ? `${city},${country}` : city;
            const response = await WeatherService.getWeather(query);
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify(response, null, 2),
                }],
                structuredContent: { response },
            };
        },
    );
}