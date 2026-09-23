import { VectorStoreChromaDB } from "./DBs/chroma.db.ts";
import { VectorStorePgVectorDB } from "./DBs/pgVector.db.ts";

// Here we will decide to go for pgVector or chroma db

export class VectorStore {
    static get()
    {
        const backend = process.env.VECTOR_DB || 'chroma';

        if(backend === "chroma") return VectorStoreChromaDB;

        else if (backend === "pgvector") return VectorStorePgVectorDB;

        else
        {
            console.error(`Invalid vector db: ${backend}`);
            throw new Error(`Invalid vector db: ${backend}`);
        } 

    }
}