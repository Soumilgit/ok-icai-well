import { NextRequest, NextResponse } from 'next/server';

interface RAGCacheEntry {
  id: string;
  query: string;
  response: string;
  context: string[];
  timestamp: number;
  userId?: string;
  category: 'interview' | 'content' | 'research' | 'compliance' | 'general';
  relevanceScore: number;
  metadata: {
    sources?: string[];
    confidence?: number;
    template?: string;
    icaiCompliant?: boolean;
  };
}

// In-memory cache (in production, use Redis or a proper database)
const ragCache = new Map<string, RAGCacheEntry>();

// Helper function to generate cache key
function generateCacheKey(query: string, category: string, userId?: string): string {
  return `${category}_${userId || 'anonymous'}_${Buffer.from(query.toLowerCase()).toString('base64').slice(0, 20)}`;
}

// Helper function to calculate semantic similarity (simple implementation)
function calculateSimilarity(query1: string, query2: string): number {
  const words1 = query1.toLowerCase().split(/\s+/);
  const words2 = query2.toLowerCase().split(/\s+/);
  
  const intersection = words1.filter(word => words2.includes(word));
  const union = [...new Set([...words1, ...words2])];
  
  return intersection.length / union.length; // Jaccard similarity
}

// Find similar cached entries
function findSimilarEntries(query: string, category: string, userId?: string, threshold = 0.3): RAGCacheEntry[] {
  const entries = Array.from(ragCache.values())
    .filter(entry => {
      const matchesCategory = entry.category === category;
      const matchesUser = !userId || entry.userId === userId;
      const similarity = calculateSimilarity(query, entry.query);
      
      return matchesCategory && matchesUser && similarity >= threshold;
    })
    .sort((a, b) => {
      const simA = calculateSimilarity(query, a.query);
      const simB = calculateSimilarity(query, b.query);
      return simB - simA;
    });
    
  return entries.slice(0, 5); // Return top 5 similar entries
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const category = searchParams.get('category') || 'general';
    const userId = searchParams.get('userId');
    
    if (!query) {
      return NextResponse.json(
        { success: false, error: 'Query parameter is required' },
        { status: 400 }
      );
    }
    
    // Try to find exact match first
    const cacheKey = generateCacheKey(query, category, userId || undefined);
    const exactMatch = ragCache.get(cacheKey);
    
    if (exactMatch) {
      // Update relevance score based on usage
      exactMatch.relevanceScore += 0.1;
      
      return NextResponse.json({
        success: true,
        data: {
          cached: true,
          entry: exactMatch,
          similarEntries: []
        }
      });
    }
    
    // Find similar entries
    const similarEntries = findSimilarEntries(query, category, userId || undefined);
    
    return NextResponse.json({
      success: true,
      data: {
        cached: false,
        entry: null,
        similarEntries
      }
    });
    
  } catch (error) {
    console.error('RAG Cache GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve from RAG cache' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, response, context, category = 'general', userId, metadata = {} } = body;
    
    if (!query || !response) {
      return NextResponse.json(
        { success: false, error: 'Query and response are required' },
        { status: 400 }
      );
    }
    
    const cacheKey = generateCacheKey(query, category, userId);
    
    const entry: RAGCacheEntry = {
      id: cacheKey,
      query,
      response,
      context: context || [],
      timestamp: Date.now(),
      userId,
      category: category as RAGCacheEntry['category'],
      relevanceScore: 1.0,
      metadata
    };
    
    ragCache.set(cacheKey, entry);
    
    return NextResponse.json({
      success: true,
      data: {
        cached: true,
        entryId: cacheKey,
        message: 'Entry cached successfully'
      }
    });
    
  } catch (error) {
    console.error('RAG Cache POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to cache entry' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { entryId, updates } = body;
    
    if (!entryId || !updates) {
      return NextResponse.json(
        { success: false, error: 'Entry ID and updates are required' },
        { status: 400 }
      );
    }
    
    const existingEntry = ragCache.get(entryId);
    if (!existingEntry) {
      return NextResponse.json(
        { success: false, error: 'Entry not found' },
        { status: 404 }
      );
    }
    
    const updatedEntry = {
      ...existingEntry,
      ...updates,
      timestamp: Date.now() // Update timestamp
    };
    
    ragCache.set(entryId, updatedEntry);
    
    return NextResponse.json({
      success: true,
      data: {
        entry: updatedEntry,
        message: 'Entry updated successfully'
      }
    });
    
  } catch (error) {
    console.error('RAG Cache PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update cache entry' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const entryId = searchParams.get('entryId');
    const userId = searchParams.get('userId');
    
    if (!entryId) {
      return NextResponse.json(
        { success: false, error: 'Entry ID is required' },
        { status: 400 }
      );
    }
    
    const entry = ragCache.get(entryId);
    if (!entry) {
      return NextResponse.json(
        { success: false, error: 'Entry not found' },
        { status: 404 }
      );
    }
    
    // Verify user owns the entry (if userId provided)
    if (userId && entry.userId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized to delete this entry' },
        { status: 403 }
      );
    }
    
    ragCache.delete(entryId);
    
    return NextResponse.json({
      success: true,
      message: 'Entry deleted successfully'
    });
    
  } catch (error) {
    console.error('RAG Cache DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete cache entry' },
      { status: 500 }
    );
  }
}