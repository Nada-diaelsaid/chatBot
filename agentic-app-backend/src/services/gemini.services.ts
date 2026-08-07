import { GoogleGenAI } from '@google/genai';
// To generate response using GeniAI
class GeminiService {
    private apiKey: string;
    private modelName: string;
    private embeddingModelName: string;
    private genai: GoogleGenAI;
    constructor(apiKey:string, modelName:string, embeddingModelName:string) {
        this.apiKey = apiKey;
        this.modelName = modelName;
        // Embedding models (e.g. gemini-embedding-2-preview) are not valid for
        // generateContent, and chat models are not valid for embedContent, so
        // they must be configured separately.
        this.embeddingModelName = embeddingModelName || modelName;
        this.genai = new GoogleGenAI({ apiKey: this.apiKey });

        if (!apiKey) {
            throw new Error('GEMINI_API_KEY is not set');
        }

        if (!modelName) {
            throw new Error('GEMINI_MODEL is not set');
        }
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
}

// To import anywhere in the project
export default GeminiService;