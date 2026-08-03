import express from 'express';
import GeminiProvider from './geminiProvider.js';
import RagProvider from './rag.js';

const router = express.Router();

router.post('/chat', async (req, res) => {
    const { message } = req.body;


    if(!message) {
        return res.status(400).json({ error: 'Message is required' });
    }

    console.log('Received message:', message);

    try {
        // GeminiProvider constructor
        const geminiProvider = new GeminiProvider(
            process.env.GEMINI_API_KEY,
            process.env.GEMINI_MODEL);

        // Prepare the prompt for the RAG model

        const ragProvider = new RagProvider();
        const prompt = ragProvider.preparePrompt(message);

        console.log('Prepared Prompt:', prompt);

        const response = await geminiProvider.generateResponse(prompt);
        console.log('Generated Response:', response);
        res.json({ reply: response });
    }
    catch (error) {
        console.error('Error generating response:', error);
        res.status(500).json({ error: 'Failed to generate response' });
    }
});

export default router;
