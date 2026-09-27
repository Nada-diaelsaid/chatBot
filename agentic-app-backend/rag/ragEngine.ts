// // Fetching relevant chuncks from Vector DB (ingest.ts -> ragEngine.ts)

// This interface defines the expected shape of chunk objects throughout the pipeline — ensuring consistent data structure from retrieval through context preparation and LLM prompt injection, catching structural mismatches at compile time
interface RAGChunk {
    id: string;
    text: string;
    metadata: {
        docId: string;
        chunkIndex: number;
        [key: string]: any; // Allow for additional metadata fields
    };
    score?: number | null; // Optional score/distance field for search results
}

import { VectorStore } from "./VectorStore/vectore.store.ts";
import { GEMEINI } from "../src/services/gemini.services.ts";

export class RagEngine {

    // query from the user
    static async buildPrompt(query:string, topK:number=4)
    {
        try
        {
            const store = VectorStore.get();
            await store.init();

            // Generate embeddings for the user query.

            const embeddings = await GEMEINI.generateEmbeddings([query]); // accept the query as an array.
            const queryEmbedding = embeddings?.[0];
            if(!queryEmbedding) {
                throw new Error("Failed to generate query embedding");
            }

            // length of the embedding generated from LLM should match the expected dimensions
            if(queryEmbedding.length !== Number(process.env.EMBEDDING_DIMS)) {
                throw new Error(`Query embedding dimensions mismatch. Expected ${process.env.EMBEDDING_DIMS}, got ${queryEmbedding.length}`);
            }

            const queryResult = await store.search(queryEmbedding, topK);

            if (!queryResult || queryResult.length === 0) {
                return {
                    prompt: `No matching documents found for the query: ${query}`,
                    sources: []
                };
            }
            // After getting the relevant chunks, we will build a prompt to send to the LLM.
            // We also need to prepare the context for the LLM. We will concatenate the text of the relevant chunks to form a context string.

            // We will change the chunk returned a little bit.
            // Standard way to do this is to add a "SOURCE" and "META" label to each chunk, so that the LLM can understand where the information is coming from and what metadata is associated with it.
            /**
             * SOURCE:
             * <chunk text>
             * 
             * META:
             * <metadata in JSON format>
             */
            // We added join because the returned result is an array of chunks, and we want to convert it into a single string, so separate each array element with 2 new lines.
            const context = queryResult.map((chunk: RAGChunk, i:number) => `SOURCE ${i + 1}:\n${chunk.text}\nMETA: ${JSON.stringify(chunk.metadata)}`).join("\n\n");

            // In case there is no answer available, the model have to say "I don't have enough information" instead of making up an answer, because that is RAG we are doing....
            const prompt = `You are a helpful assistant.
            You only answer questions based on the context provided below. If the answer is not contained within the context, respond with "I don't have enough information". 
            
            Context:
            ${context}
            
            Question:
            ${query}
            
            Answer:`;

            return {prompt, sources: queryResult};

        }
        catch(err){
            console.error("Error in buildPrompt:", err);
            throw err;
        }
    }
}