import { OpenAI } from 'openai';
import type { Tool } from 'openai/resources/responses/responses.js';
import WeatherService from './weather.service.ts';
import CustomerService from './customer.service.ts';
import type { ResponseInput } from 'openai/resources/responses/responses.js';
import type { Client } from '@modelcontextprotocol/sdk/client';
import { zodTextFormat } from 'openai/helpers/zod.mjs';
import { z } from 'zod';

// For every MCP tool called there will be different number of args..
// however zod needs a specific value type.
// So create JSON union to have the privilage of having all types.
// openAI + MCP safe
const jsonPrimitive = z.union([z.string(), z.number(), z.boolean(), z.null()]);

/**
 * TOOL ARGUMENTS
   - MUST be an object for MCP
   - No `any`, no optional
 */
const toolArgumentSchema = z.record(z.string(), jsonPrimitive);

// Prepare the schema for the response parse function.
/**
 * FINAL INTENT SCHEMA
   - Root object
   - All fields required
   - Nullable used correctly
 */
const toolIntentSchema = z.object({
    action: z.enum(['final', 'tool']),
    tool: z.string().nullable(),
    // For every MCP tool called there will be different number of args..
    arguments: toolArgumentSchema.nullable(),
    output: z.string().nullable(),
}).refine((v) => (v.action === 'tool' && v.tool !== null && v.arguments !== null ||
    // If you have a final output from llm, you cannot have output empty
    (v.action === 'final' && v.output !== null)
), {
    message: 'Invalid intent Shape for tool usage',
});

// To generate response using GeniAI
class OpenAIService {

    // Make GeminiService a singleton
    private static instance: OpenAIService;

    
    private readonly openai: OpenAI;
    private readonly modelName: string;
    private readonly embeddingModelName: string;
    private readonly apiKey: string;
    private readonly MAX_STEPS=6;

    private constructor() {
        this.apiKey = process.env.OPENAI_API_KEY || '';
        this.modelName = process.env.OPENAI_MODEL || '';
        this.embeddingModelName = process.env.OPENAI_EMBEDDING_MODEL || '';
        this.openai = new OpenAI({ apiKey: this.apiKey });
        
    }

    static getInstance(): OpenAIService {
        if (!this.instance) {
            this.instance = new OpenAIService();
        }
        return this.instance;
    }

    async generateResponse(prompt:string): Promise<string> {
        try {
            const response = await this.openai.responses.create({
                model: this.modelName,
                input: prompt,
            });
            return response.output_text || '';
        }
        catch (error: any) {
            console.error('Error generating response:', error);
            throw error;
        }
    }

    // embeddings funnction
    async generateEmbeddings(data: string | string[]) {
        try{
            const response = await this.openai.embeddings.create({
                model: this.embeddingModelName,
                input: data,
                encoding_format: "float",
            });
            const embeddings = response.data.map((embedding: any) => embedding.embedding);
            return embeddings;
        
        }
        catch (error: any) {
            console.error('Error generating embeddings:', error);
        }
    }

    async callLLM(input: string | ResponseInput, tools: Array<Tool>|undefined, instructions?: string)
    {
        try{
            const response = await this.openai.responses.create({
                model: this.modelName,
                tools: tools,
                input: input,
                tool_choice: "auto",
                instructions: instructions,
            });    
            return response;
        }
        catch(error: any)
        {
            console.log("Error genrating response, we are in callLLM function: ", error);
            throw new Error(`Error generating response using OpenAI: ${error.message}`);
        }
    }

    // TODO: NEED TO TEST, ADD CREDIT CARD TO OPENAI API KEY, AND TEST IT.

    async generateResponseWithTools(prompt:string, mcpClient:Client): Promise<string> {
        // Tools available on MCP server.
        // So that we don't hardcode anything.
        const mcpTools = await mcpClient.listTools();
        const toolContext = mcpTools.tools.map(tool => ({
            name: tool.name,
            description: tool.description,
            inputSchema: tool.inputSchema,
            outputSchema: tool.outputSchema,
        }));

        // When adding RAG, we have to update the system instruction to include the RAG context.
        const systemInstruction = `You are an AI assistant with access to internal tools via MCP. Use the tools as needed
            to answer user queries.
        If no tool is required, answer directly.
        Do NOT mention tool usage unless asked.
        Keep responses concise and helpful.`;

        // Why JSON? bec this how LLMs communicate, so that we will be able to parse data correctly.
        // Why didn't we do this in Gemini?? because Gemini has mcpToTool builtin functionality that helps with all this.
        const responseContract = 
        `You MUST ALWAYS respond in valid JSON format.
        If NO tool is required:
        {
        "action": "final",
        "tool": null,
        "arguments": null,
        "output": "<response>"
        }

        If a tool IS required:
        {
        "action": "tool",
        "tool": "<tool_name>",
        "arguments": {
            // tool-specific arguments here
        },
        "output": null
        }

        NEVER respond with plain text.
        `;

        // message state
        let message: any[] = [{
                role: 'developer',
                content: systemInstruction,
            },
            {
                role: 'developer',
                content: responseContract,
            },
            {
                role: 'developer',
                content: `Available tools: ${JSON.stringify(toolContext, null, 2)}`,
            },
            {
                role: 'user',
                content: prompt,
            },
        ];
        // Agent loop, we don't have mcpToTool builtin functionality, so we have to do this manually.
        // maxSteps > max iterations.
        for(let i = 0; i < this.MAX_STEPS; i++) {
            let intent;
            try{
                // create vs parse??
                // create is to normal chatting and raw output
                // parse is to think to generate structured output (JSON)
                const response = await this.openai.responses.parse({
                    model: this.modelName,
                    input: message,
                    // of type ResponseTextConfig
                    text: {
                        // Restrict AI model to give us structured response we are looking for.
                        // We make sure tool is properly passed with its name, args and so on, also
                        // ensure that output is not empty (DOESN"T MAKE SENSE TO HAVE A FINAL OUTPUT EMPTY)
                        format: zodTextFormat(toolIntentSchema, 'tool_intent'),
                    }
                });
                if(!response.output_parsed)
                {
                    throw new Error('No parsed output intent returned from OpenAI');
                }
                intent = response.output_parsed;
            }
        
            catch(error: any)
            {
                console.error('Error generating response with tools:', error);
                throw new Error(`Error generating response with tools using OpenAI: ${error.message}`);
            }
            // tool execution..
            if(intent.action === 'tool')
            {
                const result = await mcpClient.callTool({
                    // ! bec there has to be a tool name and arguments even if they are null
                    name: intent.tool!,
                    arguments: intent.arguments!,
                });
                message.push({role: 'assistant', content: JSON.stringify(intent)});
                // push response from tool that is being called.
                message.push({role: 'developer', content: 
                    `MCP tool "${intent.tool}" executed.
                    Structured output:
                    ${JSON.stringify(result.structuredContent, null, 2)}`});

                // go to next iteration
                continue;
            }
            // final answer from LLM 
            if(intent.action === 'final')
                return intent.output!;

        }

        // After getting out of agent loop throw an error:
        throw new Error ("Agent execution exceeded maximum steps");
    }
}
// Create a singleton instance of OpenAIService
export const OPENAI = OpenAIService.getInstance();