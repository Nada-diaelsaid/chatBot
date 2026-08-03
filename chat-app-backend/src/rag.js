import fs from 'node:fs';
import path from 'node:path';

class RagProvider
{
    preparePrompt(query)
    {
        // Prepare the prompt for the RAG model
        // Read the knowledge base data from the JSON file
        const filePath = path.join(process.cwd(), 'data', 'knowledgeBase.json');
        const kbData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        // Process the data first, prepare the context for the RAG model
        // How?
        // A way to do so, very basic way, is to parse the whole knwoldege base, since it is very very small.
        const context = kbData.map(item => `Q: ${item.question}\nA: ${item.answer}`).join('\n\n');
        const prompt =
         `You are an AI assistant with access to the following knowledge base: ${context}
        Based on the above knowledge answer the following question:
        User: ${query}
        Answer in one short paragraph:`;
        return prompt;
    }
}

export default RagProvider;