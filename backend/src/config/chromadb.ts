import { ChromaClient } from 'chromadb';
import { logger } from '../utils/logger';

const chromaHost = process.env.CHROMA_HOST || 'localhost';
const chromaPort = parseInt(process.env.CHROMA_PORT || '8000');

export const chromaClient = new ChromaClient({
  path: `http://${chromaHost}:${chromaPort}`
});

export const COLLECTION_NAME = process.env.CHROMA_COLLECTION_NAME || 'pal_knowledge_base';

// Initialize ChromaDB collection
export const initializeChromaCollection = async () => {
  try {
    // Try to get existing collection
    const collection = await chromaClient.getOrCreateCollection({
      name: COLLECTION_NAME,
      metadata: { 
        description: 'P.A.L. Knowledge Base for RAG',
        created_at: new Date().toISOString()
      }
    });
    
    logger.info(`✅ ChromaDB collection "${COLLECTION_NAME}" initialized`);
    return collection;
  } catch (error) {
    logger.error('Failed to initialize ChromaDB collection:', error);
    throw error;
  }
};

export default chromaClient;
