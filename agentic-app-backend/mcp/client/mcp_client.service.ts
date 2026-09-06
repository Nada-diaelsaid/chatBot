import {Client} from "@modelcontextprotocol/sdk/client"
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

class MCPClientService
{
    private static instance: MCPClientService;

    private tools: any[] = [];

    private initialized = false;
    client: Client;

    constructor(){
        this.client = new Client({
            name: 'node-mcp-client',
            version: '1.0.0',
        });
    }

    static getInstance(): MCPClientService
    {
        if(!this.instance){
            this.instance = new MCPClientService();
        }
        return this.instance;
    }

    // Connect the client to our MCP Server, will be called only 
    async init()
    {
        // If already initialized, return the instance
        if(this.initialized){
            return this;
        }

        // If not true we will connect to the MCP server over http
        const url = `http://localhost:${process.env.PORT}/mcp`;
        // CREATE connectivity over http:
        const transport = new StreamableHTTPClientTransport(new URL(url));
        await this.client.connect(transport);
        this.initialized = true;
        return this;
    }

    async getTools(){
        await this.init();

        if(this.tools.length === 0)
        {
            // If length is 0, we need to call the tools from the MCP server
            const list_tools = await this.client.listTools();
            this.tools = list_tools.tools;
        }
        return this.tools;
    }

    // Call a specific tool by name with input arguments
    async callTool(tool_name: string, args: Record<string, any>)
    {
        if(!this.initialized)
            await this.init();

        return await this.client.callTool({
            name: tool_name,
            arguments: args,
        });
    }

}
export const MCPClient = MCPClientService.getInstance();