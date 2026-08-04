import OpenAI from 'openai';

export default class openAIProvider {
    constructor(apiKey, modelName) {
        this.apiKey = apiKey;
        this.modelName = modelName;

        this.openai = new OpenAI({
            apiKey: this.apiKey,
        });
    }

    async generateResponse(prompt) {
        const response = await this.openai.responses.create({
            model: this.modelName,
            input: prompt,
        });
        return response.output_text || "No response from the model!!!!";
    }
}