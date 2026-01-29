/**
 * Cookie Jar - Safety net for closed tabs
 * Stores closed tabs so they can be restored later
 */

export interface CookieJarEntry {
  id: string;
  url: string;
  title: string;
  favicon?: string;
  closedAt: number;
  expiresAt: number;
}

const STORAGE_KEY = 'cookie-jar';
const EXPIRY_DAYS = 7;

/**
 * Get the expiry timestamp (7 days from now)
 */
function getExpiryTimestamp(): number {
  return Date.now() + (EXPIRY_DAYS * 24 * 60 * 60 * 1000);
}

/**
 * Add a tab to the cookie jar
 */
export function addToJar(url: string, title: string, favicon?: string): CookieJarEntry {
  const entry: CookieJarEntry = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    url,
    title,
    favicon,
    closedAt: Date.now(),
    expiresAt: getExpiryTimestamp(),
  };

  const jar = getJar();
  const updatedJar = [entry, ...jar];
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedJar));
  
  return entry;
}

/**
 * Get all entries from the cookie jar (excluding expired ones)
 */
export function getJar(): CookieJarEntry[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  
  if (!stored) {
    return [];
  }
  
  try {
    const jar: CookieJarEntry[] = JSON.parse(stored);
    // Filter out expired entries
    const now = Date.now();
    const validEntries = jar.filter(entry => entry.expiresAt > now);
    
    // If we filtered any out, update storage
    if (validEntries.length !== jar.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(validEntries));
    }
    
    return validEntries;
  } catch (e) {
    console.error('Failed to parse cookie jar:', e);
    return [];
  }
}

/**
 * Restore an entry from the jar (removes it and returns it)
 */
export function restoreFromJar(id: string): CookieJarEntry | null {
  const jar = getJar();
  const entry = jar.find(e => e.id === id);
  
  if (!entry) {
    return null;
  }
  
  // Remove from jar
  const updatedJar = jar.filter(e => e.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedJar));
  
  return entry;
}

/**
 * Clean expired entries from the jar
 */
export function cleanExpired(): number {
  const jar = getJar(); // This already filters expired entries
  const stored = localStorage.getItem(STORAGE_KEY);
  
  if (!stored) {
    return 0;
  }
  
  try {
    const allEntries: CookieJarEntry[] = JSON.parse(stored);
    const removedCount = allEntries.length - jar.length;
    return removedCount;
  } catch (e) {
    return 0;
  }
}

/**
 * Clear all entries from the jar
 */
export function clearJar(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Get a human-readable time ago string
 */
export function getTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return days === 1 ? '1 day ago' : `${days} days ago`;
  }
  if (hours > 0) {
    return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  }
  if (minutes > 0) {
    return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`;
  }
  return 'Just now';
}
