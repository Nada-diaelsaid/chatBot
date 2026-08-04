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
            process.env.GEMINI_MODEL,
            process.env.GEMINI_EMBEDDING_MODEL);

        // Prepare the prompt for the RAG model

        const ragProvider = new RagProvider();
        // const prompt = ragProvider.prepareSimpleRagPrompt(message);
        // geminiProvider.listAvailableModels();
        // For RAG with embeddings, we would first need to generate the embeddings for the query
            const queryEmbeddings = await geminiProvider.generateEmbeddings(message);
            // console.log('Query Embeddings:', queryEmbeddings);
            const queryVectors = queryEmbeddings[0];

            // Fetch FAQ vectos from faqs.json
            const faqData = ragProvider.fetchDocumentsData('faqs.json');
            // the embeddings are in the answer not questions.
            // Each answer must be wrapped as its own Content object, otherwise the API
            // treats the whole array as multiple parts of a single content and returns
            // just one combined embedding instead of one per answer.
            const faqContents = faqData.map(item => ({ parts: [{ text: item.answer }] }));
            const faqEmbeddings = await geminiProvider.generateEmbeddings(faqContents, "RETRIEVAL_DOCUMENT");
            const faqVectors = faqData.map((faq, index) => ({
                ...faq,
                vector: faqEmbeddings[index],
            }));


            const prompt = ragProvider.prepareRagPrompt(message, queryVectors, faqVectors);
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
