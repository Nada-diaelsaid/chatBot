import path from "node:path";
import { VectorStore } from "./VectorStore/vectore.store.ts";
import fs from 'node:fs';
import { GEMEINI } from "../src/services/gemini.services.ts";
import { randomUUID } from "node:crypto";

///////////////////////////////////////////////////////////////////////////////////////////////
// Responsible for collecting source/raw data (docs, txt, md files, anything) and split them to chunks
// For each chunk, for each chunk create a vector embedding(array of numbers based on semantic values)
// and store it in the vector DBs.
///////////////////////////////////////////////////////////////////////////////////////////////

// 800 characters (at max) is a good chunk size for most documents.
// Very small values like 100, 200 will cut the paragraphs make it hard to understand the context.
// Possibly making these small chunks as noises.
// While very large chunk sizes will make the embeddings too large and hard to store in the vector DB.
const CHUNK_SIZE = Number(process.env.RAG_CHUNK_SIZE) || 800;

// How much text from the previous chunk should be repeated in the next chunk 
// For the continuity of the paragraph.
// If we set it to 0, then the chunks will be completely independent of each other.
// If we set it to larger number it will increase the usage of DB.
const CHUNK_OVERLAP = Number(process.env.RAG_CHUNK_OVERLAP) || 100;

/* 
    If CHUNK_SIZE = 800 and OVERLAP = 100, then the chunks will be:

    1st chunk: 0-800
    start of 2nd: 800 - 100
    2nd chunk: 700-1500
    start of 3rd: 1500 - 100
    3rd chunk: 1400-2200
    ...
*/

function chunkText(text: string): string[]
{
    // strings that we will extract and convert the to chunks
    const chunks = [];

    let i = 0;

    while(i < text.length)
    {
        // Either the text size if it is smaller than the chunk size or the chunk size itself.
        const end = Math.min(text.length, i + CHUNK_SIZE);

        // Create a chunk starting i to end.
        chunks.push(text.slice(i, end));

        // Next chunk size will start from the chunk size - the overlap in order
        // to include the overlap characters to the next chunk.
        i += CHUNK_SIZE - CHUNK_OVERLAP;
    }

    return chunks;
}

// Main ingestion function
export async function ingestFolder(folderPath: string)
{
    // Which particular vectore DB we will be using.
    const store = VectorStore.get();

    // Initialize our DB.
    await store?.init();

    // filesystem functions

    // read the context of the dir.
    const files = await fs.readdirSync(folderPath);

    for(const file of files)
    {
        // We are only accepting those two file extensions.
        if(!file.endsWith('.txt') && !file.endsWith('.md')) continue;

        // import path to build a full path
        // proper filePath that we are going to read the data out of it.
        const filePath = path.join(folderPath, file);

        const rawData = fs.readFileSync(filePath, 'utf8');

        // convert strings to chunks
        const chunks = chunkText(rawData);

        // fetch embedding value for each chunk
        // We can use embedding of ChromaDB, or any other AI model you will be using.
        const embeddings = await GEMEINI.generateEmbeddings(chunks);

        if (!embeddings) {
            console.error(`Skipping ${file}: failed to generate embeddings`);
            continue;
        }

        // Then we need to store these embeddings in the vector DB.
        for(let i = 0; i<chunks.length; i++)
        {
            await store.upsert({
                id: randomUUID(),
                docId: file,
                chunkIndex: i,
                text: chunks[i],
                embedding: embeddings[i]!,
                metadata: { source: filePath}
            });
        }
    }
    
}