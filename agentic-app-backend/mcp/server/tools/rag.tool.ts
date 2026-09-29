import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import z from 'zod';
import { RagEngine } from '../../../rag/ragEngine.ts';

export function registerRAGTool(mcpServer: McpServer) {
    console.log("Registering RAG tool...");

    mcpServer.registerTool(
        'ragSearch',
        {
            title: 'RAG Search Tool',
            description: 'This tool allows you to perform a RAG (Retrieval-Augmented Generation) search based on a user query. It retrieves relevant documents from a vector store and generates a prompt for the LLM to answer the query based on the retrieved context.',
            inputSchema: {
                query: z.string(),
                topK: z.number().optional().default(4),
            },
            outputSchema: {
                prompt: z.string(),
                // Metadata + chunks
                sources: z.any(), // Check queryResult in ragEngine.ts for the structure of the sources returned. 
            },
        },
        async ({ query, topK }) => {
            // topK means: the number of relevant chunks to retrieve from the vector store(nearest ones). Default is 4.

            try
            {
                const result = await RagEngine.buildPrompt(query, topK);
                return {
                    content: [{
                        type: 'text',
                        text: result.prompt,
                    }],
                    structuredContent: {prompt: result.prompt, sources: result.sources},
                };
            }
            catch (error: any) {
                console.error("Error in RAG tool:", error);
                return {
                    content: [{
                        type: 'text',
                        text: `Error in RAG tool: ${(error.message)}`,
                    }],
                    structuredContent: {prompt: '', sources: []},
                };
                throw error; // Rethrow the error to be handled by the MCP server
            }
        },
    );
}