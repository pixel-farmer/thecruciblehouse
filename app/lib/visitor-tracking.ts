import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { put, del, list } from '@vercel/blob';

export interface Visitor {
  id: string;
  timestamp: string;
  page: string;
  ip?: string;
  userAgent?: string;
  referer?: string;
  country?: string;
  region?: string;
  city?: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const VISITORS_FILE = path.join(DATA_DIR, 'visitors.json');
const VISITORS_BLOB_KEY = 'visitors.json';

// Store the blob URL after first put operation
let cachedBlobUrl: string | null = null;

// Check if we're using Vercel Blob (production) or file system (local dev)
function useBlob(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}

async function ensureDataDir() {
  try {
    if (!existsSync(DATA_DIR)) {
      await mkdir(DATA_DIR, { recursive: true });
    }
  } catch (error) {
    console.error('Error creating data directory:', error);
    // In serverless environments (like Vercel), file system may be read-only
    // This is expected and we'll handle it gracefully
  }
}

export async function getVisitors(): Promise<Visitor[]> {
  // Use Vercel Blob if available (production)
  if (useBlob()) {
    try {
      // First, try to find the blob by listing blobs with our key
      const { blobs } = await list({ prefix: VISITORS_BLOB_KEY });
      
      // Find exact match
      const blob = blobs.find(b => b.pathname === VISITORS_BLOB_KEY);
      
      if (blob) {
        cachedBlobUrl = blob.url;
        // Fetch the blob content
        const response = await fetch(blob.url);
        if (response.ok) {
          const text = await response.text();
          return JSON.parse(text);
        }
      }
      return [];
    } catch (error: any) {
      // If blob doesn't exist or other error, return empty array
      console.error('Error reading visitors from Blob:', error);
      return [];
    }
  }

  // Fallback to file system (local development)
  await ensureDataDir();
  
  if (!existsSync(VISITORS_FILE)) {
    return [];
  }

  try {
    const data = await readFile(VISITORS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading visitors file:', error);
    return [];
  }
}

export async function addVisitor(visitor: Omit<Visitor, 'id' | 'timestamp'>): Promise<void> {
  try {
    const visitors = await getVisitors();
    const newVisitor: Visitor = {
      ...visitor,
      id: `visitor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
    };

    visitors.push(newVisitor);
    
    // Keep only last 10,000 visitors to prevent storage from growing too large
    const trimmedVisitors = visitors.slice(-10000);
    const jsonData = JSON.stringify(trimmedVisitors, null, 2);

    // Use Vercel Blob if available (production)
    if (useBlob()) {
      try {
        // Delete old blob if it exists
        if (cachedBlobUrl) {
          try {
            await del(cachedBlobUrl);
          } catch (error) {
            // Ignore if blob doesn't exist
          }
        } else {
          // Try to find and delete by key
          try {
            const { blobs } = await list({ prefix: VISITORS_BLOB_KEY });
            const blob = blobs.find(b => b.pathname === VISITORS_BLOB_KEY);
            if (blob) {
              await del(blob.url);
            }
          } catch (error) {
            // Ignore if blob doesn't exist
          }
        }
        
        // Upload new blob
        const blob = await put(VISITORS_BLOB_KEY, jsonData, {
          contentType: 'application/json',
          access: 'public',
        });
        cachedBlobUrl = blob.url;
        return;
      } catch (error) {
        console.error('Error writing to Blob:', error);
        // Fall through to file system if Blob fails
      }
    }

    // Fallback to file system (local development)
    await ensureDataDir();
    await writeFile(VISITORS_FILE, jsonData, 'utf-8');
  } catch (error) {
    console.error('Error adding visitor:', error);
    // Don't throw - allow site to function even if tracking fails
  }
}

export async function getVisitorStats() {
  try {
    const visitors = await getVisitors();
    
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const stats = {
      total: visitors.length,
      last24Hours: visitors.filter(v => new Date(v.timestamp) >= last24Hours).length,
      last7Days: visitors.filter(v => new Date(v.timestamp) >= last7Days).length,
      last30Days: visitors.filter(v => new Date(v.timestamp) >= last30Days).length,
      pages: {} as Record<string, number>,
      recent: visitors.slice(-50).reverse(),
    };

    // Count visits per page
    visitors.forEach(visitor => {
      const page = visitor.page || 'unknown';
      stats.pages[page] = (stats.pages[page] || 0) + 1;
    });

    return stats;
  } catch (error) {
    console.error('Error getting visitor stats:', error);
    // Return empty stats if there's an error (e.g., file system read-only in serverless)
    return {
      total: 0,
      last24Hours: 0,
      last7Days: 0,
      last30Days: 0,
      pages: {},
      recent: [],
    };
  }
}

