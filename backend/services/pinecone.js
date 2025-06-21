const { Pinecone } = require('@pinecone-database/pinecone');

const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY
});

const index = pinecone.Index(process.env.PINECONE_INDEX_NAME);

async function upsertEmbedding(vector, id, text, conversationId) {
    try {
        console.log('Storing in Pinecone:', {
            id,
            conversationId,
            textLength: text.length,
            sampleText: text.substring(0, 100)
        });

        const upsertResponse = await index.upsert([{
            id: id,
            values: vector,
            metadata: { 
                text: text,
                chunkId: id,
                conversationId: conversationId
            }
        }]);
        return upsertResponse;
    } catch (error) {
        console.error('Error upserting vectors:', error);
        throw error;
    }
}

async function queryEmbedding(vector, topK = 5, conversationId = null) {
    try {
        const queryOptions = {
            vector,
            topK,
            includeMetadata: true
        };

        // If conversationId is provided, try filtering by conversationId first
        if (conversationId) {
            queryOptions.filter = {
                conversationId: { $eq: conversationId }
            };
        }

        let queryResponse = await index.query(queryOptions);
        
        // If no results found with conversationId filter, try the old chunkId method
        if (conversationId && queryResponse.matches.length === 0) {
            console.log('No matches found with conversationId filter, trying chunkId filter...');
            // Remove filter and manually filter results by chunkId prefix
            delete queryOptions.filter;
            const allMatches = await index.query(queryOptions);
            queryResponse = {
                matches: allMatches.matches.filter(match => 
                    match.metadata?.chunkId?.startsWith(`${conversationId}-`)
                )
            };
        }
        
        console.log('Query response:', JSON.stringify(queryResponse, null, 2));
        return queryResponse.matches;
    } catch (error) {
        console.error('Error querying vectors:', error);
        throw error;
    }
}

async function deleteEmbeddings(conversationId) {
    try {
        // First, query to find all vectors for this conversation
        const queryResponse = await index.query({
            vector: Array(1536).fill(0), // Use a dummy vector for querying
            topK: 100, // Adjust based on your max chunks
            includeMetadata: true,
            filter: {
                chunkId: { $match: `${conversationId}.*` }
            }
        });

        // Get the IDs of all vectors to delete
        const vectorIds = queryResponse.matches.map(match => match.id);
        
        if (vectorIds.length > 0) {
            // Delete the vectors
            await index.delete1({
                ids: vectorIds
            });
            console.log(`Deleted ${vectorIds.length} embeddings for conversation: ${conversationId}`);
        } else {
            console.log(`No embeddings found for conversation: ${conversationId}`);
        }
    } catch (error) {
        console.warn('Warning: Error deleting Pinecone vectors:', error);
        // Don't throw the error since we want the conversation deletion to succeed
    }
}

module.exports = {
    upsertEmbedding,
    queryEmbedding,
    deleteEmbeddings
};
