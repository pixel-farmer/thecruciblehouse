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
      // Always list blobs to get the latest version (don't rely on cache in serverless)
      // This ensures we get the most up-to-date data even if multiple function instances are running
      try {
        // List all blobs (no prefix) to ensure we find it
        const { blobs } = await list();
        console.log(`[getVisitors] Found ${blobs.length} total blobs in store`);
        
        // First, try exact match
        let blob = blobs.find(b => b.pathname === VISITORS_BLOB_KEY);
        
        // If not found, try to find any blob with visitor-related name
        if (!blob) {
          blob = blobs.find(b => 
            b.pathname.includes('visitor') || 
            b.pathname.includes('visitors') ||
            b.pathname.endsWith('.json')
          );
        }
        
        if (blob) {
          console.log(`[getVisitors] Found blob: ${blob.pathname} (${blob.size} bytes, uploaded: ${blob.uploadedAt})`);
          
          // Add cache-busting query parameter to ensure we get the latest version
          // The uploadedAt timestamp helps us verify we're getting fresh data
          const urlWithCacheBust = `${blob.url}?t=${Date.now()}`;
          cachedBlobUrl = blob.url; // Update cache for future use
          
          const response = await fetch(urlWithCacheBust, {
            cache: 'no-store', // Disable caching
          });
          
          if (response.ok) {
            const text = await response.text();
            const data = JSON.parse(text);
            if (Array.isArray(data)) {
              console.log(`[getVisitors] Loaded ${data.length} visitors from blob: ${blob.pathname}`);
              // If we found a blob with a different name, log a warning
              if (blob.pathname !== VISITORS_BLOB_KEY) {
                console.log(`[getVisitors] Warning: Using blob with different name: ${blob.pathname}`);
              }
              return data;
            } else {
              console.error(`[getVisitors] Blob data is not an array:`, typeof data);
            }
          } else {
            console.error(`[getVisitors] Failed to fetch blob: ${response.status} ${response.statusText}`);
          }
        } else {
          console.log('[getVisitors] No visitor blob found in store');
        }
      } catch (error) {
        console.error('[getVisitors] Error listing blobs:', error);
      }
      
      return [];
    } catch (error: any) {
      // If blob doesn't exist or other error, return empty array
      console.error('[getVisitors] Error reading visitors from Blob:', error);
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
    console.log(`[addVisitor] Starting to add visitor for page: ${visitor.page}`);
    
    // CRITICAL: Always read existing visitors first to preserve all data
    const existingVisitors = await getVisitors();
    console.log(`[addVisitor] Current visitor count before adding: ${existingVisitors.length}`);
    
    const newVisitor: Visitor = {
      ...visitor,
      id: `visitor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
    };

    console.log(`[addVisitor] New visitor created:`, {
      id: newVisitor.id,
      page: newVisitor.page,
      timestamp: newVisitor.timestamp,
    });

    // Add new visitor to existing list
    const updatedVisitors = [...existingVisitors, newVisitor];
    console.log(`[addVisitor] Updated visitor count: ${updatedVisitors.length}`);
    
    // Keep only last 10,000 visitors to prevent storage from growing too large
    const trimmedVisitors = updatedVisitors.slice(-10000);
    const jsonData = JSON.stringify(trimmedVisitors, null, 2);
    console.log(`[addVisitor] Prepared ${trimmedVisitors.length} visitors for storage (${jsonData.length} bytes)`);

    // Use Vercel Blob if available (production)
    if (useBlob()) {
      try {
        // CRITICAL: Use put with addRandomSuffix: false to ensure we always use the same key
        // This ensures the blob persists across deployments
        // The put operation will atomically overwrite the existing blob
        console.log(`[addVisitor] Writing ${trimmedVisitors.length} visitors to blob (key: ${VISITORS_BLOB_KEY})`);
        const blob = await put(VISITORS_BLOB_KEY, jsonData, {
          contentType: 'application/json',
          access: 'public',
          addRandomSuffix: false, // CRITICAL: Must be false to use exact key and persist across deployments
        });
        
        // Update cache with new URL
        cachedBlobUrl = blob.url;
        console.log(`[addVisitor] Successfully wrote blob: ${blob.url} (${trimmedVisitors.length} visitors)`);
        
        // Small delay to ensure blob is fully propagated (CDN cache might take a moment)
        // This is optional but helps ensure consistency
        await new Promise(resolve => setTimeout(resolve, 100));
        
        return;
      } catch (error: any) {
        console.error('[addVisitor] Error writing to Blob:', error);
        console.error('[addVisitor] Error details:', {
          message: error?.message,
          name: error?.name,
          code: error?.code,
        });
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

/**
 * Recovery function to find and restore visitor data from any blob in the store
 * This can be called manually via the /api/visitors/recover endpoint
 */
export async function recoverVisitorData(): Promise<{ pathname: string; size: number; visitorsCount: number; data: Visitor[] } | null> {
  if (!useBlob()) {
    return null;
  }

  try {
    const { blobs } = await list();
    console.log(`Scanning ${blobs.length} blobs for visitor data...`);

    // Try to find any blob that contains visitor data
    for (const blob of blobs) {
      try {
        const response = await fetch(blob.url);
        if (response.ok) {
          const text = await response.text();
          const data = JSON.parse(text);
          if (Array.isArray(data) && data.length > 0 && data.every(item => typeof item === 'object' && 'id' in item && 'timestamp' in item)) {
            console.log(`Found visitor data in blob: ${blob.pathname} (${data.length} visitors)`);
            cachedBlobUrl = blob.url;
            return {
              pathname: blob.pathname,
              size: blob.size,
              visitorsCount: data.length,
              data: data,
            };
          }
        }
      } catch (error) {
        // Continue to next blob
      }
    }

    return null;
  } catch (error) {
    console.error('Error recovering visitor data:', error);
    return null;
  }
}

