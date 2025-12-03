import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

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

async function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    await mkdir(DATA_DIR, { recursive: true });
  }
}

export async function getVisitors(): Promise<Visitor[]> {
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
  await ensureDataDir();

  const visitors = await getVisitors();
  const newVisitor: Visitor = {
    ...visitor,
    id: `visitor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
  };

  visitors.push(newVisitor);
  
  // Keep only last 10,000 visitors to prevent file from growing too large
  const trimmedVisitors = visitors.slice(-10000);

  await writeFile(VISITORS_FILE, JSON.stringify(trimmedVisitors, null, 2), 'utf-8');
}

export async function getVisitorStats() {
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
}

