require('dotenv').config();
const { testPineconeConnection } = require('./services/pinecone');

async function testConnection() {
    console.log('🔍 Testing Pinecone Connection...\n');
    
    try {
        const isConnected = await testPineconeConnection();
        
        if (isConnected) {
            console.log('\n✅ Pinecone is working correctly!');
            process.exit(0);
        } else {
            console.log('\n❌ Pinecone connection failed!');
            process.exit(1);
        }
    } catch (error) {
        console.error('\n💥 Test failed with error:', error.message);
        process.exit(1);
    }
}

testConnection(); 