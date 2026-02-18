import { GoogleGenerativeAI } from '@google/generative-ai';
import { ChromaClient } from 'chromadb';
import { logger } from '../utils/logger';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

// Initialize ChromaDB client
const chromaClient = new ChromaClient({
  path: `http://${process.env.CHROMA_HOST || 'localhost'}:${process.env.CHROMA_PORT || 8000}`
});

const COLLECTION_NAME = process.env.CHROMA_COLLECTION_NAME || 'pal_knowledge_base';

interface RAGQueryOptions {
  userId?: string;
  branch?: string;
  phase?: string;
  language?: 'en' | 'hi';
  maxResults?: number;
}

interface RAGResponse {
  answer: string;
  sources: Array<{
    content: string;
    metadata: any;
    score: number;
  }>;
  confidence: number;
  language: string;
}

class RAGService {
  private collection: any = null;

  /**
   * Initialize ChromaDB collection
   */
  async initialize(): Promise<void> {
    try {
      // Try to get existing collection
      this.collection = await chromaClient.getOrCreateCollection({
        name: COLLECTION_NAME,
        metadata: { description: 'P.A.L. Knowledge Base' }
      });
      logger.info(`✅ ChromaDB collection '${COLLECTION_NAME}' initialized`);
    } catch (error) {
      logger.warn('ChromaDB not available - using fallback mode:', error);
      this.collection = null; // Will use fallback responses
    }
  }

  /**
   * Add documents to knowledge base
   */
  async addDocuments(documents: Array<{
    content: string;
    metadata: {
      title: string;
      source: string;
      branch?: string;
      phase?: string;
      documentType?: string;
      uploadedBy?: string;
      uploadedAt?: string;
    };
  }>): Promise<void> {
    if (!this.collection) {
      await this.initialize();
    }

    try {
      // Split documents into chunks
      const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 512,
        chunkOverlap: 50
      });

      const allChunks: string[] = [];
      const allMetadata: any[] = [];
      const allIds: string[] = [];

      for (const doc of documents) {
        const chunks = await textSplitter.splitText(doc.content);
        
        for (let i = 0; i < chunks.length; i++) {
          allChunks.push(chunks[i]);
          allMetadata.push({
            ...doc.metadata,
            chunkIndex: i,
            totalChunks: chunks.length
          });
          allIds.push(`${doc.metadata.source}_chunk_${i}_${Date.now()}`);
        }
      }

      // Generate embeddings using Gemini
      const embeddings = await this.generateEmbeddings(allChunks);

      // Add to ChromaDB
      await this.collection.add({
        ids: allIds,
        embeddings,
        documents: allChunks,
        metadatas: allMetadata
      });

      logger.info(`Added ${allChunks.length} chunks to knowledge base`);
    } catch (error) {
      logger.error('Error adding documents to knowledge base:', error);
      throw error;
    }
  }

  /**
   * Query the knowledge base
   */
  async query(query: string, options: RAGQueryOptions = {}): Promise<RAGResponse> {
    if (!this.collection) {
      await this.initialize();
    }

    // FALLBACK: If ChromaDB is still not available, use simple Gemini responses
    if (!this.collection) {
      logger.warn('ChromaDB not available - using fallback Gemini responses');
      return await this.fallbackQuery(query, options);
    }

    try {
      const {
        userId,
        branch,
        phase,
        language = 'en',
        maxResults = 5
      } = options;

      // Detect language if not provided
      const detectedLanguage = language || await this.detectLanguage(query);

      // Generate query embedding
      const queryEmbedding = await this.generateEmbeddings([query]);

      // Build where filter for tiered retrieval
      const whereFilter: any = {};
      if (branch) whereFilter.branch = branch;
      if (phase) whereFilter.phase = phase;

      // Query ChromaDB with MMR for diversity
      const results = await this.collection.query({
        queryEmbeddings: queryEmbedding,
        nResults: maxResults,
        where: Object.keys(whereFilter).length > 0 ? whereFilter : undefined
      });

      // If no results with filters, try without filters
      let finalResults = results;
      if (results.documents[0].length === 0 && Object.keys(whereFilter).length > 0) {
        logger.info('No results with filters, trying without filters');
        finalResults = await this.collection.query({
          queryEmbeddings: queryEmbedding,
          nResults: maxResults
        });
      }

      // Format sources
      const sources = finalResults.documents[0].map((doc: string, idx: number) => ({
        content: doc,
        metadata: finalResults.metadatas[0][idx],
        score: 1 - (finalResults.distances[0][idx] || 0)
      }));

      // Generate answer using Gemini
      const { answer, confidence } = await this.generateAnswer(query, sources, detectedLanguage);

      return {
        answer,
        sources,
        confidence,
        language: detectedLanguage
      };
    } catch (error) {
      logger.error('Error querying knowledge base:', error);
      throw error;
    }
  }

  /**
   * Generate embeddings using Gemini
   */
  private async generateEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      const embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' });
      
      const embeddings: number[][] = [];
      
      // Process in batches to avoid rate limits
      const batchSize = 10;
      for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);
        const batchEmbeddings = await Promise.all(
          batch.map(async (text) => {
            const result = await embeddingModel.embedContent(text);
            return result.embedding.values;
          })
        );
        embeddings.push(...batchEmbeddings);
      }

      return embeddings;
    } catch (error) {
      logger.error('Error generating embeddings:', error);
      throw error;
    }
  }

  /**
   * Generate answer using Gemini with context
   */
  private async generateAnswer(
    query: string,
    sources: Array<{ content: string; metadata: any; score: number }>,
    language: string
  ): Promise<{ answer: string; confidence: number }> {
    try {
      // Build context from sources
      const context = sources
        .map((s, idx) => `[${idx + 1}] ${s.content}`)
        .join('\n\n');

      // Build prompt
      const systemPrompt = language === 'hi'
        ? `आप P.A.L. हैं - एक सहायक AI जो नए छात्रों की मदद करता है। दिए गए संदर्भ का उपयोग करके प्रश्न का उत्तर दें।`
        : `You are P.A.L. - a helpful AI assistant for college onboarding. Answer the question using the provided context.`;

      const prompt = `${systemPrompt}

Context:
${context}

Question: ${query}

Instructions:
- Answer in ${language === 'hi' ? 'Hindi' : 'English'}
- Be concise and helpful
- If the context doesn't contain enough information, acknowledge uncertainty
- Cite sources using [1], [2], etc.

Answer:`;

      const result = await model.generateContent(prompt);
      const answer = result.response.text();

      // Calculate confidence based on source scores
      const avgScore = sources.reduce((sum, s) => sum + s.score, 0) / sources.length;
      const confidence = Math.min(avgScore * 1.2, 1.0); // Boost slightly, cap at 1.0

      return { answer, confidence };
    } catch (error) {
      logger.error('Error generating answer:', error);
      throw error;
    }
  }

  /**
   * Detect language of text
   */
  private async detectLanguage(text: string): Promise<'en' | 'hi'> {
    // Simple heuristic: check for Devanagari script
    const hindiPattern = /[\u0900-\u097F]/;
    return hindiPattern.test(text) ? 'hi' : 'en';
  }

  /**
   * Delete documents from knowledge base
   */
  async deleteDocuments(documentIds: string[]): Promise<void> {
    if (!this.collection) {
      await this.initialize();
    }

    try {
      await this.collection.delete({
        ids: documentIds
      });
      logger.info(`Deleted ${documentIds.length} documents from knowledge base`);
    } catch (error) {
      logger.error('Error deleting documents:', error);
      throw error;
    }
  }

  /**
   * Search documents by metadata
   */
  async searchByMetadata(metadata: Record<string, any>, limit: number = 10): Promise<any[]> {
    if (!this.collection) {
      await this.initialize();
    }

    try {
      const results = await this.collection.get({
        where: metadata,
        limit
      });

      return results.documents.map((doc: string, idx: number) => ({
        id: results.ids[idx],
        content: doc,
        metadata: results.metadatas[idx]
      }));
    } catch (error) {
      logger.error('Error searching by metadata:', error);
      throw error;
    }
  }

  /**
   * Fallback query when ChromaDB is not available
   * Uses Gemini directly without RAG
   */
  private async fallbackQuery(query: string, options: RAGQueryOptions = {}): Promise<RAGResponse> {
    try {
      const language = options.language || 'en';
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

      const prompt = language === 'hi'
        ? `आप एक कैंपस सहायक हैं। निम्नलिखित प्रश्न का उत्तर दें:\n\n${query}\n\nयदि आपको जानकारी नहीं है, तो कृपया स्पष्ट रूप से बताएं।`
        : `You are a campus assistant for a college onboarding system. Answer the following question:\n\n${query}\n\nIf you don't have specific information, please say so clearly and suggest contacting the admin.`;

      const result = await model.generateContent(prompt);
      const answer = result.response.text();

      return {
        answer,
        sources: [],
        confidence: 0.6, // Lower confidence without RAG
        language
      };
    } catch (error) {
      logger.error('Error in fallback query:', error);
      // Return a generic error message
      return {
        answer: options.language === 'hi'
          ? 'क्षमा करें, मैं अभी आपकी मदद नहीं कर सकता। कृपया बाद में पुनः प्रयास करें।'
          : 'Sorry, I cannot help you right now. Please try again later or contact the admin.',
        sources: [],
        confidence: 0.3,
        language: options.language || 'en'
      };
    }
  }
}

export default new RAGService();
