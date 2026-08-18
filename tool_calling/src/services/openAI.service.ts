import { OpenAI } from 'openai';
import type { Tool } from 'openai/resources/responses/responses.js';
import WeatherService from './weather.service.ts';
import CustomerService from './customer.service.ts';
import type { ResponseInput } from 'openai/resources/responses/responses.js';
// To generate response using GeniAI
class OpenAIService {

    // Make GeminiService a singleton
    private static instance: OpenAIService;

    
    private readonly openai: OpenAI;
    private readonly modelName: string;
    private readonly embeddingModelName: string;
    private readonly apiKey: string;

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

    async generateResponseWithTools(prompt:string): Promise<string> {
        try {
            // prepare tools::
            // see documentation for more details: https://developers.openai.com/api/docs/guides/function-calling?_sm_vck=Jnj2QrQw2gqqNNgDf2F0ZzD1JN5Jv17WNvN2r5P0sgzjrR7wNstT&lang=javascript#defining-functions
            // see documentation for more details: https://developers.openai.com/api/reference/typescript/resources/responses/methods/create

            const tools: Tool[] = [
                {
                    type: 'function',
                    name: "get_all_customers",
                    description: "Get list of all registered customers",
                    parameters: {
                        type: "object",
                        properties: {
                            limit: {
                                // In case limit is not passed, it will be null
                                type: ["number", "null"],
                                description: "The number of customers to get"
                            },
                        },
                        required: ["limit"],
                        additionalProperties: false,
                    },
                    strict: true,
                },
                {
                    type: 'function',
                    name: "get_current_weather",
                    description: "Get the current weather for a given city",
                    parameters: {
                        type: "object",
                        properties: {
                            location: {
                                type: "string",
                                description: "The city to fetch the weather for"
                            },
                        },
                        required: ["location"],
                        additionalProperties: false,
                    },
                    strict: true,
                },
            ];
            // Here on the first LLM call, we are passing the prompt as a string and the tools to the model.
            // TODO: should we construct a prompt object of type ResponseInput instead of a string??
            // Hey I will do it anyway
            let input: ResponseInput = [
              { 
                role: "user", 
                content: prompt
              },
            ];
            

            let response = await this.callLLM(input, tools);
            console.log("Response from the first LLM call: ", response);
            console.log("response.functionCalls: ", response.output);
            
            console.log("Input for the second LLM call: ", input);
            
            
            // Handle function calls
            for (const item of response.output) {
                if (item.type !== "function_call") continue;
                // Preserve model output for the next turn
                input.push(item);// original function call, type is "reasoning"
                
                let result: any;
                switch (item.name) 
                {
                    case "get_all_customers":
                    {
                        // Extract args from the function call
                        const { limit } = JSON.parse(item.arguments);
                        result = await CustomerService.getLatestCustomers(limit);
                        break;
                    }
                    case "get_current_weather":
                    {
                        const { location } = JSON.parse(item.arguments);
                        if (typeof location !== 'string')
                        {
                            throw new Error("Invalid location");
                        }
                        result = await WeatherService.getWeather(location);
                        break;
                    }
                    default:
                        break;
                }
            console.log("Result in generateResponseWithTools function: ", result);
            // 4. Provide function call results to the model
            input.push({
                type: "function_call_output",
                call_id: item.call_id,
                output: JSON.stringify(result),
              });

            }
            const instructions = "Respond clearly using the tool output.";
            // Final response..
            const responseFollowUp = await this.callLLM(input, tools, instructions);

            return responseFollowUp.output_text || 'No response generated.';
        }
        catch (error: any) {
            console.error('Error generating response, we are in generateResponseWithTools function:', error);
            throw error;
        }
    }
}

// Create a singleton instance of OpenAIService
export const OPENAI = OpenAIService.getInstance();