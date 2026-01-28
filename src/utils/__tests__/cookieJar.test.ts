import { describe, it, expect, beforeEach } from 'vitest';
import {
  getJar,
  addToJar,
  restoreFromJar,
  cleanExpired,
  clearJar,
  getTimeAgo,
  getSessions,
  saveSession,
  restoreSession,
  clearSessions,
  cleanExpiredSessions,
  getDefaultSessionName,
  type CookieJarEntry,
  type Session,
  type SessionTab,
} from '../cookieJar';

// Mock localStorage
const localStorageMock = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
});

describe('cookieJar', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('addToJar', () => {
    it('stores entry with correct timestamps', () => {
      const before = Date.now();
      const entry = addToJar('https://example.com', 'Example Site', 'favicon.ico');
      const after = Date.now();

      expect(entry.url).toBe('https://example.com');
      expect(entry.title).toBe('Example Site');
      expect(entry.favicon).toBe('favicon.ico');
      expect(entry.closedAt).toBeGreaterThanOrEqual(before);
      expect(entry.closedAt).toBeLessThanOrEqual(after);
      
      // Expires in 7 days
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
      expect(entry.expiresAt).toBeGreaterThanOrEqual(before + sevenDaysMs);
      expect(entry.expiresAt).toBeLessThanOrEqual(after + sevenDaysMs);
    });

    it('generates unique IDs for each entry', () => {
      const entry1 = addToJar('https://example1.com', 'Site 1');
      const entry2 = addToJar('https://example2.com', 'Site 2');

      expect(entry1.id).not.toBe(entry2.id);
    });

    it('adds entries to the beginning of the jar (most recent first)', () => {
      addToJar('https://first.com', 'First');
      addToJar('https://second.com', 'Second');

      const jar = getJar();
      expect(jar[0].url).toBe('https://second.com');
      expect(jar[1].url).toBe('https://first.com');
    });

    it('uses "Untitled" for empty titles', () => {
      const entry = addToJar('https://example.com', '');
      expect(entry.title).toBe('Untitled');
    });
  });

  describe('getJar', () => {
    it('returns all entries', () => {
      addToJar('https://example1.com', 'Site 1');
      addToJar('https://example2.com', 'Site 2');
      addToJar('https://example3.com', 'Site 3');

      const jar = getJar();
      expect(jar).toHaveLength(3);
    });

    it('returns empty array when jar is empty', () => {
      const jar = getJar();
      expect(jar).toEqual([]);
    });

    it('returns empty array on invalid JSON', () => {
      localStorage.setItem('cookie-jar', 'invalid json');
      const jar = getJar();
      expect(jar).toEqual([]);
    });
  });

  describe('restoreFromJar', () => {
    it('removes and returns entry', () => {
      const entry = addToJar('https://example.com', 'Example');
      
      const restored = restoreFromJar(entry.id);
      
      expect(restored).not.toBeNull();
      expect(restored!.url).toBe('https://example.com');
      expect(restored!.title).toBe('Example');
      
      // Entry should be removed from jar
      const jar = getJar();
      expect(jar).toHaveLength(0);
    });

    it('returns null for non-existent entry', () => {
      addToJar('https://example.com', 'Example');
      
      const restored = restoreFromJar('non-existent-id');
      
      expect(restored).toBeNull();
    });

    it('only removes the specified entry', () => {
      const entry1 = addToJar('https://example1.com', 'Site 1');
      const entry2 = addToJar('https://example2.com', 'Site 2');
      
      restoreFromJar(entry1.id);
      
      const jar = getJar();
      expect(jar).toHaveLength(1);
      expect(jar[0].id).toBe(entry2.id);
    });
  });

  describe('cleanExpired', () => {
    it('removes old entries', () => {
      // Add a valid entry
      addToJar('https://valid.com', 'Valid');
      
      // Manually add an expired entry
      const jar = getJar();
      const expiredEntry: CookieJarEntry = {
        id: 'expired-entry',
        url: 'https://expired.com',
        title: 'Expired',
        closedAt: Date.now() - 8 * 24 * 60 * 60 * 1000, // 8 days ago
        expiresAt: Date.now() - 1 * 24 * 60 * 60 * 1000, // Expired 1 day ago
      };
      jar.push(expiredEntry);
      localStorage.setItem('cookie-jar', JSON.stringify(jar));
      
      const expired = cleanExpired();
      
      expect(expired).toHaveLength(1);
      expect(expired[0].id).toBe('expired-entry');
      
      const remaining = getJar();
      expect(remaining).toHaveLength(1);
      expect(remaining[0].url).toBe('https://valid.com');
    });

    it('returns empty array when nothing is expired', () => {
      addToJar('https://valid.com', 'Valid');
      
      const expired = cleanExpired();
      
      expect(expired).toHaveLength(0);
    });
  });

  describe('clearJar', () => {
    it('removes all entries', () => {
      addToJar('https://example1.com', 'Site 1');
      addToJar('https://example2.com', 'Site 2');
      
      clearJar();
      
      const jar = getJar();
      expect(jar).toHaveLength(0);
    });
  });

  describe('getTimeAgo', () => {
    it('returns "Just now" for very recent times', () => {
      const result = getTimeAgo(Date.now() - 30 * 1000); // 30 seconds ago
      expect(result).toBe('Just now');
    });

    it('returns minutes for times less than an hour ago', () => {
      const result = getTimeAgo(Date.now() - 5 * 60 * 1000); // 5 minutes ago
      expect(result).toBe('5 minutes ago');
    });

    it('returns singular minute', () => {
      const result = getTimeAgo(Date.now() - 1 * 60 * 1000); // 1 minute ago
      expect(result).toBe('1 minute ago');
    });

    it('returns hours for times less than a day ago', () => {
      const result = getTimeAgo(Date.now() - 3 * 60 * 60 * 1000); // 3 hours ago
      expect(result).toBe('3 hours ago');
    });

    it('returns singular hour', () => {
      const result = getTimeAgo(Date.now() - 1 * 60 * 60 * 1000); // 1 hour ago
      expect(result).toBe('1 hour ago');
    });

    it('returns days for times more than a day ago', () => {
      const result = getTimeAgo(Date.now() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
      expect(result).toBe('2 days ago');
    });

    it('returns singular day', () => {
      const result = getTimeAgo(Date.now() - 1 * 24 * 60 * 60 * 1000); // 1 day ago
      expect(result).toBe('1 day ago');
    });
  });

  // ========== SESSION TESTS ==========

  describe('saveSession', () => {
    it('stores multiple tabs as a group', () => {
      const tabs: SessionTab[] = [
        { url: 'https://example1.com', title: 'Site 1' },
        { url: 'https://example2.com', title: 'Site 2' },
        { url: 'https://example3.com', title: 'Site 3' },
      ];
      
      const before = Date.now();
      const session = saveSession('My Session', tabs);
      const after = Date.now();
      
      expect(session.name).toBe('My Session');
      expect(session.tabs).toHaveLength(3);
      expect(session.tabs[0].url).toBe('https://example1.com');
      expect(session.tabs[1].url).toBe('https://example2.com');
      expect(session.tabs[2].url).toBe('https://example3.com');
      expect(session.savedAt).toBeGreaterThanOrEqual(before);
      expect(session.savedAt).toBeLessThanOrEqual(after);
      
      // Expires in 7 days
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
      expect(session.expiresAt).toBeGreaterThanOrEqual(before + sevenDaysMs);
      expect(session.expiresAt).toBeLessThanOrEqual(after + sevenDaysMs);
    });

    it('generates unique IDs for each session', () => {
      const tabs: SessionTab[] = [{ url: 'https://example.com', title: 'Test' }];
      
      const session1 = saveSession('Session 1', tabs);
      const session2 = saveSession('Session 2', tabs);
      
      expect(session1.id).not.toBe(session2.id);
    });

    it('adds sessions to the beginning (most recent first)', () => {
      const tabs: SessionTab[] = [{ url: 'https://example.com', title: 'Test' }];
      
      saveSession('First Session', tabs);
      saveSession('Second Session', tabs);
      
      const sessions = getSessions();
      expect(sessions[0].name).toBe('Second Session');
      expect(sessions[1].name).toBe('First Session');
    });

    it('uses default name if empty string provided', () => {
      const tabs: SessionTab[] = [{ url: 'https://example.com', title: 'Test' }];
      
      const session = saveSession('', tabs);
      
      expect(session.name).toContain('Session -');
    });

    it('preserves breadcrumbs in session tabs', () => {
      const breadcrumbs = [
        { url: 'https://start.com', title: 'Start', timestamp: Date.now() - 1000 },
        { url: 'https://example.com', title: 'Example', timestamp: Date.now() },
      ];
      const tabs: SessionTab[] = [
        { url: 'https://example.com', title: 'Example', breadcrumbs },
      ];
      
      const session = saveSession('Test', tabs);
      
      expect(session.tabs[0].breadcrumbs).toHaveLength(2);
      expect(session.tabs[0].breadcrumbs![0].url).toBe('https://start.com');
    });
  });

  describe('getSessions', () => {
    it('returns all sessions', () => {
      const tabs: SessionTab[] = [{ url: 'https://example.com', title: 'Test' }];
      
      saveSession('Session 1', tabs);
      saveSession('Session 2', tabs);
      saveSession('Session 3', tabs);
      
      const sessions = getSessions();
      expect(sessions).toHaveLength(3);
    });

    it('returns empty array when no sessions exist', () => {
      const sessions = getSessions();
      expect(sessions).toEqual([]);
    });

    it('returns empty array on invalid JSON', () => {
      localStorage.setItem('cookie-jar-sessions', 'invalid json');
      const sessions = getSessions();
      expect(sessions).toEqual([]);
    });
  });

  describe('restoreSession', () => {
    it('returns all tabs in session', () => {
      const tabs: SessionTab[] = [
        { url: 'https://example1.com', title: 'Site 1' },
        { url: 'https://example2.com', title: 'Site 2' },
      ];
      
      const session = saveSession('Test Session', tabs);
      const restored = restoreSession(session.id);
      
      expect(restored).not.toBeNull();
      expect(restored).toHaveLength(2);
      expect(restored![0].url).toBe('https://example1.com');
      expect(restored![1].url).toBe('https://example2.com');
    });

    it('removes session from storage after restore', () => {
      const tabs: SessionTab[] = [{ url: 'https://example.com', title: 'Test' }];
      
      const session = saveSession('Test Session', tabs);
      restoreSession(session.id);
      
      const sessions = getSessions();
      expect(sessions).toHaveLength(0);
    });

    it('returns null for non-existent session', () => {
      const tabs: SessionTab[] = [{ url: 'https://example.com', title: 'Test' }];
      saveSession('Test Session', tabs);
      
      const restored = restoreSession('non-existent-id');
      
      expect(restored).toBeNull();
    });

    it('only removes the specified session', () => {
      const tabs: SessionTab[] = [{ url: 'https://example.com', title: 'Test' }];
      
      const session1 = saveSession('Session 1', tabs);
      const session2 = saveSession('Session 2', tabs);
      
      restoreSession(session1.id);
      
      const sessions = getSessions();
      expect(sessions).toHaveLength(1);
      expect(sessions[0].id).toBe(session2.id);
    });
  });

  describe('cleanExpiredSessions', () => {
    it('removes expired sessions', () => {
      const tabs: SessionTab[] = [{ url: 'https://example.com', title: 'Test' }];
      
      // Add a valid session
      saveSession('Valid Session', tabs);
      
      // Manually add an expired session
      const sessions = getSessions();
      const expiredSession: Session = {
        id: 'expired-session',
        name: 'Expired Session',
        savedAt: Date.now() - 8 * 24 * 60 * 60 * 1000,
        expiresAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
        tabs: [{ url: 'https://expired.com', title: 'Expired' }],
      };
      sessions.push(expiredSession);
      localStorage.setItem('cookie-jar-sessions', JSON.stringify(sessions));
      
      const expired = cleanExpiredSessions();
      
      expect(expired).toHaveLength(1);
      expect(expired[0].id).toBe('expired-session');
      
      const remaining = getSessions();
      expect(remaining).toHaveLength(1);
      expect(remaining[0].name).toBe('Valid Session');
    });
  });

  describe('clearSessions', () => {
    it('removes all sessions', () => {
      const tabs: SessionTab[] = [{ url: 'https://example.com', title: 'Test' }];
      
      saveSession('Session 1', tabs);
      saveSession('Session 2', tabs);
      
      clearSessions();
      
      const sessions = getSessions();
      expect(sessions).toHaveLength(0);
    });
  });

  describe('getDefaultSessionName', () => {
    it('returns a string containing "Session -"', () => {
      const name = getDefaultSessionName();
      expect(name).toContain('Session -');
    });

    it('includes date/time information', () => {
      const name = getDefaultSessionName();
      // Should contain month abbreviation (Jan, Feb, etc.) or time
      expect(name).toMatch(/Session - \w+ \d+/);
    });
  });
});
