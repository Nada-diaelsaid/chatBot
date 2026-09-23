import { Pool } from "pg";
import pgvector from "pgvector/pg";
const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
});

// connect the pool to the database
// At each connection, we need to ensure that the pgvector
// extension is created and the type is registered
// Once connection is established we will work with functionality part
pool.on("connect", async(client) => {
    console.log("Connected to PostgreSQL");
    await client.query('CREATE EXTENSION IF NOT EXISTS vector;');
    await pgvector.registerType(client);
});

// check this documentation: https://node-postgres.com/

export class VectorStorePgVectorDB {
    // Flag for initialization "Singelton pattern"
    private static initialized = false;
    private static table = process.env.POSTGRES_TABLE || 'rag_vectors';
    private static embeddingDims = Number(process.env.EMBEDDING_DIMS) || 3072;

    static async init() {
        if (this.initialized) return;
        this.initialized = true;

        console.log(`Initializing PostgreSQL vector store with table: ${this.table} and embedding dimensions: ${this.embeddingDims}`);

        // Use sql queries.
        await pool.query(`CREATE TABLE IF NOT EXISTS ${this.table} 
            (id TEXT PRIMARY KEY,
             doc_id TEXT NOT NULL,
             chunk_index INT NOT NULL,
             content TEXT NOT NULL,
             embedding VECTOR(${this.embeddingDims}),
             metadata JSONB
            );`);

            console.log("pgvector: Skpping all indeces (3072 dims exceed index limits)")
    }

    static async upsert(params: {
        // Must be same name used in chromaDB, in order to work properly in the VectorStore class.
        id: string,
        docId: string,
        chunkIndex: number,
        text: string,
        embedding: number[],
        metadata?: any,
    }) {
        // Extract all fields
        const { id, docId, chunkIndex, text, embedding, metadata } = params;

        // Validate embedding dimensions
        if(embedding.length !== this.embeddingDims) {
            throw new Error(`Embedding dimensions mismatch. Expected ${this.embeddingDims}, got ${embedding.length}`);
        }

        // If matches we will got for insertion.
        // ON CONFLICT ensures that if the id already exists, it will update the existing record instead of inserting a new one.
        // In this case, we are updating the content, embedding, and metadata fields, not all params. content, embedding, and metadata are the fields that can change for a given id. The docId and chunkIndex are assumed to be constant for a given id.

        // Why done this -> pgvector.toSql(embedding)??
        // it will convert javascript array to a format that PostgreSQL understands for the vector literal type. The pgvector library provides this utility function to ensure that the embedding is correctly formatted for insertion into the database.
        // example: embedding = [0.1, 0.2, 0.3] will be converted to '[0.1, 0.2, 0.3]'::vector(3072) for PostgreSQL.
        await pool.query(`INSERT INTO ${this.table} (id, doc_id, chunk_index, content, embedding, metadata) 
        VALUES ($1, $2, $3, $4, $5, $6)
        
        ON CONFLICT (id) DO UPDATE SET
            content = EXCLUDED.content,
            embedding = EXCLUDED.embedding,
            metadata = EXCLUDED.metadata;`, 
        [id, docId, chunkIndex, text, pgvector.toSql(embedding), JSON.stringify(metadata)]);
    }

    /*
        When implementing vector search using the pgvector extension in PostgreSQL, choosing between HNSW (Hierarchical Navigable Small World) and IVFFlat (Inverted File Flat) comes down to a fundamental trade-off: query performance and accuracy (HNSW) versus index build speed and memory efficiency (IVFFlat).


        How They Work1. HNSW (Hierarchical Navigable Small World)HNSW structures your vector data into a multi-layer graph network. Top layers have long-distance connections for fast routing, while lower layers contain tightly clustered local neighbors.The Big Advantage: It is completely data-agnostic. You can create the index on an empty table, and as you continuously INSERT new rows, the graph dynamically updates without losing its accuracy.
    */
    static async search(embedding: number[], topK: number=4){
        // topK is the most relevant answers.

        // embedding is converted to distance using the <=> operator, $1 is the pgvector distance operator (L2 distance by default).

        // $1 is first passed value which is embedding, $2 is second value which is topK. We are using parameterized queries to prevent SQL injection attacks.
        const result = await pool.query(`SELECT id, doc_id, chunk_index, content, metadata, embedding <=> $1 AS distance
        FROM ${this.table}
        ORDER BY distance
        LIMIT $2;`, [pgvector.toSql(embedding), topK]);
        
        // Cosine similarity is executed automatically.
        // After query is ready:
        return result.rows.map((row) => ({
            id: row.id,
            text: row.content,
            metadata: {
                docId: row.doc_id,
                chunkIndex: row.chunk_index,
                ...row.metadata,
            },
            // row.distance is the value we got from the embedding.
            score: row.distance,
        }));
    }
}