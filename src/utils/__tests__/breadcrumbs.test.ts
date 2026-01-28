import { describe, it, expect, beforeEach } from 'vitest';
import {
  addCrumb,
  getTrail,
  clearTrail,
  setTrail,
  exportTrail,
  getAllTrails,
  clearAllTrails,
  type Breadcrumb,
} from '../breadcrumbs';

describe('breadcrumbs', () => {
  beforeEach(() => {
    // Clear all trails before each test
    clearAllTrails();
  });

  describe('addCrumb', () => {
    it('builds trail correctly', () => {
      addCrumb('tab1', 'https://example.com', 'Example');
      addCrumb('tab1', 'https://example.com/page1', 'Page 1');
      addCrumb('tab1', 'https://example.com/page2', 'Page 2');

      const trail = getTrail('tab1');
      expect(trail).toHaveLength(3);
      expect(trail[0].url).toBe('https://example.com');
      expect(trail[0].title).toBe('Example');
      expect(trail[1].url).toBe('https://example.com/page1');
      expect(trail[2].url).toBe('https://example.com/page2');
    });

    it('does not add duplicate consecutive entries', () => {
      addCrumb('tab1', 'https://example.com', 'Example');
      addCrumb('tab1', 'https://example.com', 'Example');
      addCrumb('tab1', 'https://example.com', 'Example Updated');

      const trail = getTrail('tab1');
      expect(trail).toHaveLength(1);
      expect(trail[0].title).toBe('Example Updated'); // Title should be updated
    });

    it('adds timestamp to each crumb', () => {
      const before = Date.now();
      addCrumb('tab1', 'https://example.com', 'Example');
      const after = Date.now();

      const trail = getTrail('tab1');
      expect(trail[0].timestamp).toBeGreaterThanOrEqual(before);
      expect(trail[0].timestamp).toBeLessThanOrEqual(after);
    });

    it('uses "Untitled" for empty titles', () => {
      addCrumb('tab1', 'https://example.com', '');

      const trail = getTrail('tab1');
      expect(trail[0].title).toBe('Untitled');
    });
  });

  describe('getTrail', () => {
    it('returns trail for specific tab', () => {
      addCrumb('tab1', 'https://example1.com', 'Example 1');
      addCrumb('tab2', 'https://example2.com', 'Example 2');

      const trail1 = getTrail('tab1');
      const trail2 = getTrail('tab2');

      expect(trail1).toHaveLength(1);
      expect(trail1[0].url).toBe('https://example1.com');
      expect(trail2).toHaveLength(1);
      expect(trail2[0].url).toBe('https://example2.com');
    });

    it('returns empty array for non-existent tab', () => {
      const trail = getTrail('non-existent');
      expect(trail).toEqual([]);
    });
  });

  describe('trails are isolated per tab', () => {
    it('each tab has its own independent trail', () => {
      addCrumb('tab1', 'https://site-a.com', 'Site A');
      addCrumb('tab1', 'https://site-a.com/page', 'Site A Page');
      addCrumb('tab2', 'https://site-b.com', 'Site B');

      const trail1 = getTrail('tab1');
      const trail2 = getTrail('tab2');

      expect(trail1).toHaveLength(2);
      expect(trail2).toHaveLength(1);
      expect(trail1[0].url).toBe('https://site-a.com');
      expect(trail2[0].url).toBe('https://site-b.com');
    });

    it('clearing one tab does not affect others', () => {
      addCrumb('tab1', 'https://site-a.com', 'Site A');
      addCrumb('tab2', 'https://site-b.com', 'Site B');

      clearTrail('tab1');

      expect(getTrail('tab1')).toEqual([]);
      expect(getTrail('tab2')).toHaveLength(1);
    });
  });

  describe('clearTrail', () => {
    it('removes trail for specific tab', () => {
      addCrumb('tab1', 'https://example.com', 'Example');
      expect(getTrail('tab1')).toHaveLength(1);

      clearTrail('tab1');
      expect(getTrail('tab1')).toEqual([]);
    });

    it('does nothing for non-existent tab', () => {
      // Should not throw
      clearTrail('non-existent');
      expect(getTrail('non-existent')).toEqual([]);
    });
  });

  describe('setTrail', () => {
    it('sets entire trail for a tab', () => {
      const crumbs: Breadcrumb[] = [
        { url: 'https://a.com', title: 'A', timestamp: 1000 },
        { url: 'https://b.com', title: 'B', timestamp: 2000 },
        { url: 'https://c.com', title: 'C', timestamp: 3000 },
      ];

      setTrail('tab1', crumbs);

      const trail = getTrail('tab1');
      expect(trail).toHaveLength(3);
      expect(trail[0].url).toBe('https://a.com');
      expect(trail[2].url).toBe('https://c.com');
    });

    it('creates a copy of the input array', () => {
      const crumbs: Breadcrumb[] = [
        { url: 'https://a.com', title: 'A', timestamp: 1000 },
      ];

      setTrail('tab1', crumbs);
      crumbs.push({ url: 'https://b.com', title: 'B', timestamp: 2000 });

      // Original modification should not affect stored trail
      expect(getTrail('tab1')).toHaveLength(1);
    });
  });

  describe('exportTrail', () => {
    it('returns a copy of the trail', () => {
      addCrumb('tab1', 'https://example.com', 'Example');

      const exported = exportTrail('tab1');
      exported.push({ url: 'https://modified.com', title: 'Modified', timestamp: Date.now() });

      // Original trail should not be affected
      expect(getTrail('tab1')).toHaveLength(1);
    });

    it('returns empty array for non-existent tab', () => {
      const exported = exportTrail('non-existent');
      expect(exported).toEqual([]);
    });
  });

  describe('getAllTrails', () => {
    it('returns all trails', () => {
      addCrumb('tab1', 'https://a.com', 'A');
      addCrumb('tab2', 'https://b.com', 'B');

      const all = getAllTrails();
      expect(all.size).toBe(2);
      expect(all.has('tab1')).toBe(true);
      expect(all.has('tab2')).toBe(true);
    });
  });

  describe('clearAllTrails', () => {
    it('removes all trails', () => {
      addCrumb('tab1', 'https://a.com', 'A');
      addCrumb('tab2', 'https://b.com', 'B');

      clearAllTrails();

      expect(getAllTrails().size).toBe(0);
      expect(getTrail('tab1')).toEqual([]);
      expect(getTrail('tab2')).toEqual([]);
    });
  });
});
