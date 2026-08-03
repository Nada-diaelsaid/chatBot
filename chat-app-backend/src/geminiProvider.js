import { GoogleGenAI } from '@google/genai';
// To generate response using GeniAI
class GeminiProvider {
    constructor(apiKey, modelName) {
        this.apiKey = apiKey;
        this.modelName = modelName;

        if (!apiKey) {
            throw new Error('GEMINI_API_KEY is not set');
        }

        if (!modelName) {
            throw new Error('GEMINI_MODEL is not set');
        }
    }

    async generateResponse(prompt) {
        try {
            const genai = new GoogleGenAI(this.apiKey);
            const interaction = await genai.interactions.create({
                model: this.modelName,
                input: prompt,
                generation_config: {
                    thinking_level: "low",
                  },
              
            });
            console.log(interaction.output_text);

        }
        catch (error) {
            console.error('Error generating response:', error);
            throw error;
        }
    }
}

// To import anywhere in the project
export default GeminiProvider;