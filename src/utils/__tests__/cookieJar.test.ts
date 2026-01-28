import { describe, it, expect, beforeEach } from 'vitest';
import {
  getJar,
  addToJar,
  restoreFromJar,
  cleanExpired,
  clearJar,
  getTimeAgo,
  type CookieJarEntry,
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
});
