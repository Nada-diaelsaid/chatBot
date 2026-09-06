import { GEMEINI } from "../services/gemini.services.ts";
import { MCPClient } from "../../mcp/client/mcp_client.service.ts";

import type { Request, Response } from "express";
export default class ChatController {
    static async generateResponse(req: Request, res: Response) {
        const { message } = req.body;
    
        if(!message) {
            return res.status(400).json({ error: 'Message is required' });
        }
        try {
            const mcp = await MCPClient.init();
            const response = await GEMEINI.generateResponseWithTools(message, mcp.client);
            console.log('Generated response:', response);
            return res.json({ reply: response });
        }
        catch (error: any) {
            console.error('Error generating response:', error);
            return res.status(500).json({ error: 'Failed to generate response' });
        }
    }
}