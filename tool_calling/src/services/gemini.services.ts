import { FunctionCallingConfigMode, GoogleGenAI, Type } from '@google/genai';
import type { ContentListUnion, ToolListUnion } from '@google/genai';
import WeatherService from './weather.service.ts';
import CustomerService from './customer.service.ts';
// To generate response using GeniAI
class GeminiService {

    // Make GeminiService a singleton
    private static instance: GeminiService;

    
    private readonly modelName: string;
    private readonly embeddingModelName: string;
    private readonly genai: GoogleGenAI;
    private constructor() {
        const modelName = process.env.GEMINI_MODEL || ''
        const embeddingModelName = process.env.GEMINI_EMBEDDING_MODEL || ''
        const apiKey = process.env.GEMINI_API_KEY;
        
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY is not set');
        }

        this.modelName = modelName;
        // Embedding models (e.g. gemini-embedding-2-preview) are not valid for
        // generateContent, and chat models are not valid for embedContent, so
        // they must be configured separately.
        this.embeddingModelName = embeddingModelName || modelName;
        this.genai = new GoogleGenAI({ apiKey });

        

        if (!modelName) {
            throw new Error('GEMINI_MODEL is not set');
        }
    }

    static getInstance(): GeminiService {
        if (!this.instance) {
            this.instance = new GeminiService();
        }
        return this.instance;
    }

    async generateResponse(prompt:string): Promise<string> {
        try {
            const response = await this.genai.models.generateContent({
                model: this.modelName,
                contents: prompt,
            });
            return response.text || '';
        }
        catch (error: any) {
            console.error('Error generating response:', error);
            throw error;
        }
    }

    // embeddings funnction
    async generateEmbeddings(data: string | string[], task_type="RETRIEVAL_DOCUMENT") {
        try{
            const response = await this.genai.models.embedContent({
                model: this.embeddingModelName,
                contents: data,
                config: {
                    taskType: task_type,
                },
            });
            const embeddings = response!.embeddings!.map(embedding => embedding.values);
            return embeddings;
        
        }
        catch (error: any) {
            console.error('Error generating embeddings:', error);
        }
    }

    async listAvailableModels() {
        const models = await this.genai.models.list();
        let page = models.page;
        while (page.length > 0) {
        for (const model of page) {
            if (model.supportedActions?.includes("embedContent")) {
                console.log(`- ${model.name} (${model.displayName}) | [Actions: ${model.supportedActions.join(", ")}]`);
            }
        }
            page = models.hasNextPage() ? await models.nextPage() : [];
        }

    }

    async callLLM(contents: ContentListUnion, tools: ToolListUnion|undefined)
    {
        try{
            const response = await this.genai.models.generateContent({
                model: this.modelName,
                contents: contents,
                config: {
                    tools: tools,
                    toolConfig: {
                        // Let the model decide which tool to use based on natrual language context
                        // Auto is the default mode
                        functionCallingConfig: {
                            mode: FunctionCallingConfigMode.AUTO,
                        },
                    },
                },
            });    
            return response;
        }
        catch(error: any)
        {
            console.log("Error genrating response, we are in callLLM function: ", error);
            throw new Error(`Error generating response: ${error.message}`);
        }
    }

    async generateResponseWithTools(prompt:string): Promise<string> {
        try {
            // prepare tools::
            const getWeatherFn = {
                name: "get_current_weather",
                description: "Get the current weather for a given city",
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        location: {
                            type: Type.STRING,
                            description: "The city to fetch the weather for"
                        },
                    },
                    required: ["location"],
                },
            };

            const getCustomersFn = {
                name: "get_all_customers",
                description: "Get list of all registered customers",
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        limit: {
                            type: Type.NUMBER,
                            description: "The number of customers to get"
                        },
                    }, // no parameters
                    required: [],
                },
            };

            // tool calling configuration of type ToolListUnion ::
            const tools = [
                {
                    functionDeclarations: [getWeatherFn, getCustomersFn],
                },
            ];
            // Here on the first LLM call, we are passing the prompt as a string and the tools to the model.
            const response = await this.callLLM(prompt, tools);
            console.log("Response from the first LLM call: ", response);
            console.log("response.functionCalls: ", response.functionCalls);
            // In case Geminin decides to call a function:
            // If function call exists, and its length is more than zero, which means a function has been called.
            if (response.functionCalls && response.functionCalls?.length > 0)
            {
                const funcCall = response.functionCalls[0];
                const {name, args} = funcCall ;

                let result: any;
                switch (name) {
                    case "get_current_weather":
                    {
                        const location = (args as {location: string })?.location;
                        if (typeof location !== 'string')
                        {
                            throw new Error("Invalid location");
                        }
                        result = await WeatherService.getWeather(location);
                        break;
                    }
                    case "get_all_customers":
                    {
                        const limit = (args as {limit: number })?.limit;
                        result = await CustomerService.getLatestCustomers(limit);
                        break;
                    }
                    default:
                        break;
                }
                // We have to send the result back to the LLM model for structurig the response.
                // We have to execute this code again, but will add it to a function to avoid repitition..
                // const response = await this.genai.models.generateContent({
                //     model: this.modelName,
                //     contents: prompt,
                //     config: {
                //         tools: [
                //             {
                //                 functionDeclarations: [getWeatherFn, getCustomersFn],
                //             }
                //         ],
                //         toolConfig: {
                //             // Let the model decide which tool to use based on natrual language context
                //             // Auto is the default mode
                //             functionCallingConfig: {
                //                 mode: FunctionCallingConfigMode.AUTO,
                //             }
                //         }
    
                //     }
                // });

                const constructedPrompt = [
                    {
                        role: "user",
                        parts: [
                            {
                                text: prompt
                            }
                        ] 
                    },
                    {
                        role: "user",
                        parts: [
                            {
                                functionResponse: {
                                    name,
                                    response: {result}
                                }
                            }
                        ] 
                    }
                ];
                // Here on the second LLM call, we are passing the constructed prompt and the tools to the model.
                const responseFollowUp = await this.callLLM(constructedPrompt, tools);

                return responseFollowUp.text || 'No response generated.';
            }
            // if gemini answered directly without tool calling.
            return response.text || 'No response generated.';
        }
        catch (error: any) {
            console.error('Error generating response, we are in generateResponseWithTools function:', error);
            throw error;
        }
    }
}

// Create a singleton instance of GeminiService
export const GEMEINI = GeminiService.getInstance();