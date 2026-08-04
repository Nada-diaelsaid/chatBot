import fs from 'node:fs';
import path from 'node:path';
import cosineSimilarity from "compute-cosine-similarity";

class RagProvider
{
    fetchDocumentsData(fileName)
    {
        const filePath = path.join(process.cwd(), 'data', fileName);
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        return data;

    }
    prepareSimpleRagPrompt(query)
    {
        // Retreve data
        const kbData = this.fetchDocumentsData('knowledgeBase.json');

        // Prepare the prompt for the RAG model
        // Read the knowledge base data from the JSON file

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

    prepareRagPrompt(query, queryVector, faqVectors){
        // query: from user
        // queryVector: embeddings of the query
        // prepare embeddings, prompt ...

        // find best matches use cosine similarity
        // Check each faq against the query vector, and get biggest value close to 1
        const  ranked = faqVectors.map((faq) => ({
            ...faq,
            similarity: cosineSimilarity(queryVector, faq.vector),
        })).sort((a, b) => b.similarity - a.similarity)
        .slice(0,2); // slice to get top two values..

        // console.log('Best Matches:', ranked);
        const context = ranked.map(item => `${item.answer}`).join('\n');

        // prepare prompt
        // const prompt = `
        // Use the context below to answer. If an answer isn't there say "I don't know"
        // Context: ${context}
        // User: ${query}`.trim();
        const prompt = `
        Use the context below to answer. If an answer isn't there say "This info is not found in the documentation, 
        but I can help you as much as I can." and try to help based on your general knowledge."
        Context: ${context}
        User: ${query}`.trim();
        return prompt;

    }
}

export default RagProvider;