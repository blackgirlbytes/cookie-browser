/**
 * Cookie Jar - Safety Net for Closed Tabs
 * 
 * Automatically saves closed tabs so users never lose important pages by accident.
 * Tabs expire after 7 days to prevent unlimited growth.
 */

import type { Breadcrumb } from './breadcrumbs';

export interface CookieJarEntry {
  id: string;
  url: string;
  title: string;
  favicon?: string;
  closedAt: number;
  expiresAt: number;
  breadcrumbs?: Breadcrumb[];
}

export interface SessionTab {
  url: string;
  title: string;
  favicon?: string;
  breadcrumbs?: Breadcrumb[];
}

export interface Session {
  id: string;
  name: string;
  savedAt: number;
  expiresAt: number;
  tabs: SessionTab[];
}

const STORAGE_KEY = 'cookie-jar';
const SESSIONS_STORAGE_KEY = 'cookie-jar-sessions';
const EXPIRY_DAYS = 7;
const EXPIRY_MS = EXPIRY_DAYS * 24 * 60 * 60 * 1000;

/**
 * Get all entries from the Cookie Jar
 */
export function getJar(): CookieJarEntry[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  
  try {
    const entries: CookieJarEntry[] = JSON.parse(stored);
    return entries;
  } catch (e) {
    console.error('Failed to parse cookie jar:', e);
    return [];
  }
}

/**
 * Save entries to the Cookie Jar
 */
function saveJar(entries: CookieJarEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

/**
 * Add a closed tab to the Cookie Jar
 */
export function addToJar(
  url: string,
  title: string,
  favicon?: string,
  breadcrumbs?: Breadcrumb[]
): CookieJarEntry {
  const now = Date.now();
  const entry: CookieJarEntry = {
    id: `jar-${now}-${Math.random().toString(36).substr(2, 9)}`,
    url,
    title: title || 'Untitled',
    favicon,
    closedAt: now,
    expiresAt: now + EXPIRY_MS,
    breadcrumbs: breadcrumbs || [],
  };
  
  const jar = getJar();
  // Add to beginning (most recent first)
  jar.unshift(entry);
  saveJar(jar);
  
  return entry;
}

/**
 * Restore a tab from the Cookie Jar (removes it from the jar)
 */
export function restoreFromJar(id: string): CookieJarEntry | null {
  const jar = getJar();
  const index = jar.findIndex(entry => entry.id === id);
  
  if (index === -1) return null;
  
  const [entry] = jar.splice(index, 1);
  saveJar(jar);
  
  return entry;
}

/**
 * Remove expired entries from the Cookie Jar
 */
export function cleanExpired(): CookieJarEntry[] {
  const now = Date.now();
  const jar = getJar();
  const validEntries = jar.filter(entry => entry.expiresAt > now);
  const expiredEntries = jar.filter(entry => entry.expiresAt <= now);
  
  if (expiredEntries.length > 0) {
    saveJar(validEntries);
  }
  
  return expiredEntries;
}

/**
 * Clear all entries from the Cookie Jar
 */
export function clearJar(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Get a human-readable "time ago" string
 */
export function getTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

// ========== SESSION MANAGEMENT ==========

/**
 * Get all saved sessions
 */
export function getSessions(): Session[] {
  const stored = localStorage.getItem(SESSIONS_STORAGE_KEY);
  if (!stored) return [];
  
  try {
    const sessions: Session[] = JSON.parse(stored);
    return sessions;
  } catch (e) {
    console.error('Failed to parse sessions:', e);
    return [];
  }
}

/**
 * Save sessions to storage
 */
function saveSessions(sessions: Session[]): void {
  localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
}

/**
 * Generate a default session name based on current date/time
 */
export function getDefaultSessionName(): string {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  };
  return `Session - ${now.toLocaleString('en-US', options)}`;
}

/**
 * Save multiple tabs as a session
 */
export function saveSession(name: string, tabs: SessionTab[]): Session {
  const now = Date.now();
  const session: Session = {
    id: `session-${now}-${Math.random().toString(36).substr(2, 9)}`,
    name: name || getDefaultSessionName(),
    savedAt: now,
    expiresAt: now + EXPIRY_MS,
    tabs: tabs.map(tab => ({
      url: tab.url,
      title: tab.title || 'Untitled',
      favicon: tab.favicon,
      breadcrumbs: tab.breadcrumbs || [],
    })),
  };
  
  const sessions = getSessions();
  // Add to beginning (most recent first)
  sessions.unshift(session);
  saveSessions(sessions);
  
  return session;
}

/**
 * Restore a session (removes it from storage and returns all tabs)
 */
export function restoreSession(sessionId: string): SessionTab[] | null {
  const sessions = getSessions();
  const index = sessions.findIndex(s => s.id === sessionId);
  
  if (index === -1) return null;
  
  const [session] = sessions.splice(index, 1);
  saveSessions(sessions);
  
  return session.tabs;
}

/**
 * Delete a session without restoring
 */
export function deleteSession(sessionId: string): boolean {
  const sessions = getSessions();
  const index = sessions.findIndex(s => s.id === sessionId);
  
  if (index === -1) return false;
  
  sessions.splice(index, 1);
  saveSessions(sessions);
  
  return true;
}

/**
 * Remove expired sessions
 */
export function cleanExpiredSessions(): Session[] {
  const now = Date.now();
  const sessions = getSessions();
  const validSessions = sessions.filter(s => s.expiresAt > now);
  const expiredSessions = sessions.filter(s => s.expiresAt <= now);
  
  if (expiredSessions.length > 0) {
    saveSessions(validSessions);
  }
  
  return expiredSessions;
}

/**
 * Clear all sessions
 */
export function clearSessions(): void {
  localStorage.removeItem(SESSIONS_STORAGE_KEY);
}
