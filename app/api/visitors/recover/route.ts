import { NextResponse } from 'next/server';
import { list } from '@vercel/blob';

/**
 * Recovery endpoint to check for existing visitor data in Vercel Blob
 * This can help recover data if it was accidentally deleted
 */
export async function GET() {
  try {
    // Check if Blob is configured
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json({ 
        error: 'Blob storage not configured',
        message: 'BLOB_READ_WRITE_TOKEN environment variable is not set'
      }, { status: 400 });
    }

    // List all blobs to find any visitor-related data
    const allBlobs = await list();
    const visitorBlobs = allBlobs.blobs.filter(blob => 
      blob.pathname.includes('visitor') || 
      blob.pathname.includes('visitors') ||
      blob.pathname.endsWith('.json')
    );

    const results = [];

    for (const blob of visitorBlobs) {
      try {
        const response = await fetch(blob.url);
        if (response.ok) {
          const text = await response.text();
          const data = JSON.parse(text);
          
          if (Array.isArray(data)) {
            results.push({
              pathname: blob.pathname,
              url: blob.url,
              size: blob.size,
              uploadedAt: blob.uploadedAt,
              visitorCount: data.length,
              sample: data.slice(0, 3), // First 3 visitors as sample
            });
          }
        }
      } catch (error) {
        // Skip blobs that can't be parsed
        continue;
      }
    }

    return NextResponse.json({
      found: results.length > 0,
      blobs: results,
      message: results.length > 0 
        ? `Found ${results.length} blob(s) with visitor data`
        : 'No visitor data found in Blob storage'
    });
  } catch (error) {
    console.error('Recovery error:', error);
    return NextResponse.json({ 
      error: 'Failed to recover data',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

