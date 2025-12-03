# Race Condition Fix for Visitor Tracking

## Problem
Visitor data is being lost when multiple visitors are tracked simultaneously. The count goes from 7 to 3, losing data.

## Root Cause
This is a classic "lost update" race condition:
1. Request A reads blob (5 visitors)
2. Request B reads blob (5 visitors) - at the same time
3. Request A adds visitor (6), writes
4. Request B adds visitor (6 based on old data), writes - overwrites A's write
5. Result: One visitor is lost

## Solutions Implemented

### 1. Retry Logic with Fresh Reads
- 5 retry attempts (increased from 3)
- 500ms delay between retries (increased from 200ms)
- Each retry reads fresh data from blob

### 2. Deduplication
- Removes duplicate visitors by ID
- Sorts by timestamp to maintain order

### 3. Verification
- After writing, verifies the new visitor exists in the blob
- If verification fails, retries with fresh data

### 4. Random Initial Delay
- 0-200ms random delay before processing
- Spreads out concurrent requests

## Limitations

Vercel Blob doesn't support:
- Atomic transactions
- Optimistic locking
- Conditional writes (ETags)

This means some data loss is possible under high concurrency.

## Recommended Solutions

For production, consider:

1. **Use a Database** (PostgreSQL, MySQL) with proper transactions
2. **Use Vercel KV** (Redis) with atomic operations
3. **Queue System** - Batch writes to serialize them
4. **Append-Only Log** - Store each visitor separately, merge on read

For now, the retry logic should significantly reduce data loss.

