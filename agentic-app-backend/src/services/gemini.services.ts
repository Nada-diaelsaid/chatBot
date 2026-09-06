import { GoogleGenAI, mcpToTool } from '@google/genai';
import {Client} from "@modelcontextprotocol/sdk/client"

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

    extractResponseText(response: any): string {
        const candidate = response.candidates[0];
        if(!candidate) {
            return '';
        }
        else {
            // step 1: Find the primary text part in the model's final response
            const text = candidate.content.parts[0].text;
            if(text) {
                // to remove white spaces.
                return text.trim();
            }
            
        }

        // step 2: Fallback for debugging (rarely happens with auto tooling)
        // will not give actual answer from LLM, but it will give us what is the response we got out of the funtion.
        const structuredPart = candidate.content?.parts.find((p: any) => p.functionRespone?.response?.structuredContent);
        if (structuredPart) {
            // If the model gave NO text, but tool data exists, you can fall back to the data
            return (
              "Tool executed successfully, but no natural language summary was provided. Raw data:\n" +
              JSON.stringify(
                structuredPart.functionResponse.response.structuredContent,
                null,
                2
              )
            );
          }
      
          return "No valid response was generated.";
    }

    // We will now create a function to generate a response with the help of tools
    async generateResponseWithTools(prompt:string, mcpClient: Client): Promise<string> {
        try {
            const response = await this.genai.models.generateContent({
                model: this.modelName,
                // Will change content, this will help me to pass more prompts if needed.
                contents: [{
                    role: 'user',
                    parts: [
                        {
                            text: prompt
                        }
                    ]
                }],
                config: {
                    // Must pass this bec in case the user asks a question that is not related to the tools,
                    // Gemini will answer using your intrinsic knowledge. (Answer coming directly from the model)
                    systemInstruction:
                    {
                        role: 'model',
                        parts:[{
                            text: `You are an AI assistant specialized in E-commerce data (orders and customers) and weather data
                            too. When user asks a question about orders or customers or weather information,
                            use the provided ToolSchema. **If the questions is unrelated to your tools, 
                            answer using your intrinsic knowledge.** Be concise and do not mention the tols were used unless asked.`,
                        }],
                    },
                    // No need for follow up calls with mcpToTool functionality in Gemini.
                    tools: [
                        mcpToTool(mcpClient),
                    ],
                },

            });
            this.extractResponseText(response);
            return response.text || '';
        }
        catch (error: any) {
            console.error('Error generating response:', error);
            throw error;
        }
    }

}

// Create a singleton instance of GeminiService
export const GEMEINI = GeminiService.getInstance();