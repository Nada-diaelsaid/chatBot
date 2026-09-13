import { ChromaClient } from "chromadb";
import { randomUUID } from "node:crypto";

// Optional args
const chroma = new ChromaClient({
        host: process.env.CHROMA_HOST || 'localhost',
        port: process.env.CHROMA_PORT? Number(process.env.CHROMA_PORT) : 8000,
        ssl: process.env.CHROMA_SSL === 'true',
    });

// create a collection
const COLLECTION_NAME = process.env.CHROMA_COLLECTION || 'rag_docs';

// static utility class
export class VectorStoreChromaDB {
    private static collection: any;

    static async init()
    {
        // We can create an embedding within chroma itself,
        // but we will create an embedding using openAI or Gemini.
        this.collection = await chroma.getOrCreateCollection({
            name: COLLECTION_NAME,
        });
    }

    // Create some queries::

    // Function to update and/or insert (called upsert :D)
    static async upsert(params: {
        // id for every chunk inserted.
        id: string,
        // which document does this chunk inswerted belong to?
        docId: string,
        // Navigates to the position of the chunk in the document.
        chunkIndex: number,
        // Actual content
        text: string,
        // Array of numbers that represent the embedding of the text.
        embedding: number[],
        // Any extra info we have.
        metadata?: any,
    }) {

        // Extract all info from param object.
        const { id, docId, chunkIndex, text, embedding, metadata } = params;


        // Insert the chunk into the collection.
        await this.collection.upsert({
            // As id of type array, why?
            // Bec upsert expects an array of ids. So we will wrap the id value in an array.

            // Same for other parameters:
            ids: [id],
            documents: [text],
            embeddings: [embedding],
            // Add the document id and chunk index to the metadata.
            // This will help us later when we query for documents.
            metadatas: [{
                docId,
                chunkIndex,
                // spread operator, instead of passing an object within an object,
                // we pass the properties of the object. (spread it)
                ...metadata,
            }],
        });
    }

    // https://docs.trychroma.com/docs/querying-collections/query-and-get
    // top most relevant chunks.
    static async search(embedding: number[], topK: number=4)
    {
        // Search the collection for the most relevant chunks.

        // For searching we don't have to perform cosine similarity or anythiing,
        // As chroma already does it for us.
        const results = await this.collection.query({
            // must pass embeddings as an array
            query_embeddings: [embedding],
            // How many results to return.
            n_results: topK,
        });

        // return only first doc,
        return results.documents[0].map((doc: string, index: number) => ({
            // Generate a random UUID for the id.
            id: randomUUID(),
            text: doc,
            metadata: results.metadatas[0][index],
            // Pass score if it exists
            score: results.distances?.[0]?.[index] ?? null
        }));
    }

    static async get(id: string)
    {
        //
        const result = await this.collection.get({
            id: [id],
        });
    }
}
export default chroma;