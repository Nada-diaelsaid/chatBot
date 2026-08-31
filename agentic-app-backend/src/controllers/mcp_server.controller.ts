import type { Request, Response } from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp";
import { createMCPServer } from "../../mcp/server/mcpServer.ts";
import { randomUUID } from 'node:crypto';
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types";

const mcpServer = createMCPServer();

// A flag for toggling sessions, ON/OFF
// see: https://github.com/modelcontextprotocol/typescript-sdk/blob/main/docs/serving/sessions-state-scaling.md
const USE_SESSIONS = true;

// Store transports per session, only when USE_SESSIONS is true

// key value pair, sessionId and transport
const sessionTransports: Record<string, StreamableHTTPServerTransport> = {};


export class McpServerController {
    // helper functions
    private static getSessionTransport(sessionId?: string)
    {
        if (!USE_SESSIONS) return null;
        return sessionId ? sessionTransports[sessionId] : null;
    }

    private static createTransport()
    {
        const transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: USE_SESSIONS ? () => randomUUID() : undefined,
            enableJsonResponse: true,
            onsessioninitialized: sessionId => {
                if(USE_SESSIONS) {
                    // Assigning transport for its particular session
                    sessionTransports[sessionId] = transport;
                }
            }
        });

        // cleanup to avoid memory leaks, delete the transport from the sessionTransports map
        if(USE_SESSIONS) {
            transport.onclose = () => {
                if(transport.sessionId) {
                    delete sessionTransports[transport.sessionId];
                }
            };
        }
        return transport;
    }

    // post function for client server connection
    static async handlePost(req: Request, res: Response)
    {
        const sessionId = req.headers['mcp-session-id'] as string | undefined;

        let transport = this.getSessionTransport(sessionId);

        if (USE_SESSIONS) {
            // New initialized session
            if (!transport && isInitializeRequest(req.body))
            {
                console.log("Initialize new MCP session");
                transport = this.createTransport();

                // Connect to the MCP server.
                await mcpServer.connect(transport);
                await transport.handleRequest(req, res, req.body);
                return;
        
            }
            if (!transport) {
                return res.status(400).json({
                    jsonrpc:"2.0",
                    error: {code: -32000, message: "No transport found" } });
            }
        }
        if(!USE_SESSIONS)
        {
            // No sessions, so we need to create a new transport
            // Stateles mode:
            transport = this.createTransport();
            if (!transport)
            {
                return res.status(400).send("Invalid or missing session ID");
            }
        
            await mcpServer.connect(transport);

            await transport.handleRequest(req, res, req.body);
            return;

        }
    }

    // GET: Server -> Client (notifications)
    static async handleGet(req: Request, res: Response)
    {
        if(!USE_SESSIONS)
        {
            return res.status(400).send("Stateless mode not supported in GET requests");
        }

        const sessionId = req.headers['mcp-session-id'] as string | undefined;

        const transport = this.getSessionTransport(sessionId);

        if (!transport)
        {
            return res.status(400).send("Invalid or missing session ID");
        }

        await transport.handleRequest(req, res, req.body);
        return;
    }

    static async handleDelete(req: Request, res: Response)
    {
        if(!USE_SESSIONS)
        {
            return res.status(400).send("Stateless mode is active, No session to DELETE");
        }

        const sessionId = req.headers['mcp-session-id'] as string | undefined;

        const transport = this.getSessionTransport(sessionId);

        if (!transport)
        {
            return res.status(400).send("Invalid or missing session ID");
        }

        await transport.handleRequest(req, res, req.body);
        return;    
    }
}