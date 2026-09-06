import type { Request, Response } from "express";
import { MCPClient } from "../../mcp/client/mcp_client.service.ts";
import { GEMEINI } from "../services/gemini.services.ts";

export class AgentController {
    // Here we will chat with LLM model
    static async generateResponse(req: Request, res: Response) {
        const { message, model } = req.body;
        const selectedModel = model || "gemini";

        if(!message) {
            return res.status(400).json({ error: 'Message is required' });
        }
        try {

            const mcp = await MCPClient.init();
            const tools = await mcp.getTools();
            const response = await GEMEINI.generateResponseWithTools(message, mcp.client);
            if(selectedModel === "gemini")
            {                
                console.log('In Agent controller, Generated response:', response);
                return res.json({ reply: response });
            }
            else if(selectedModel === "gpt")
            {
                // Call OpenAI model
            }
        }
        catch (error: any) {
            console.error('Error generating response:', error);
            return res.status(500).json({ error: 'Failed to generate response' });
        }
    }

}