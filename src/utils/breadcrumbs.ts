/**
 * Breadcrumbs - Navigation Trail Tracker
 * 
 * Tracks the navigation path for each tab so users can see
 * how they got to the current page and retrace their steps.
 */

export interface Breadcrumb {
  url: string;
  title: string;
  timestamp: number;
}

export interface TabTrail {
  tabId: string;
  crumbs: Breadcrumb[];
}

// In-memory storage for breadcrumb trails per tab
// Key: tabId, Value: array of breadcrumbs
const trails: Map<string, Breadcrumb[]> = new Map();

/**
 * Add a breadcrumb to a tab's trail
 */
export function addCrumb(tabId: string, url: string, title: string): void {
  const trail = trails.get(tabId) || [];
  
  // Don't add duplicate consecutive entries
  if (trail.length > 0) {
    const lastCrumb = trail[trail.length - 1];
    if (lastCrumb.url === url) {
      // Update title if it changed
      if (lastCrumb.title !== title) {
        lastCrumb.title = title;
      }
      return;
    }
  }
  
  const crumb: Breadcrumb = {
    url,
    title: title || 'Untitled',
    timestamp: Date.now(),
  };
  
  trail.push(crumb);
  trails.set(tabId, trail);
}

/**
 * Get the breadcrumb trail for a specific tab
 */
export function getTrail(tabId: string): Breadcrumb[] {
  return trails.get(tabId) || [];
}

/**
 * Clear the trail for a specific tab
 */
export function clearTrail(tabId: string): void {
  trails.delete(tabId);
}

/**
 * Set the entire trail for a tab (used when restoring from Cookie Jar)
 */
export function setTrail(tabId: string, crumbs: Breadcrumb[]): void {
  trails.set(tabId, [...crumbs]);
}

/**
 * Get all trails (for debugging/testing)
 */
export function getAllTrails(): Map<string, Breadcrumb[]> {
  return new Map(trails);
}

/**
 * Clear all trails (useful for testing)
 */
export function clearAllTrails(): void {
  trails.clear();
}

/**
 * Export trail as a serializable array (for saving to Cookie Jar)
 */
export function exportTrail(tabId: string): Breadcrumb[] {
  return [...(trails.get(tabId) || [])];
}
