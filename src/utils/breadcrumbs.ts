/**
 * Breadcrumbs - Track navigation trails per tab
 * Helps users understand how they got to the current page
 */

export interface Breadcrumb {
  url: string;
  title: string;
  timestamp: number;
}

// In-memory storage for breadcrumb trails, keyed by tab ID
const trails: Map<string, Breadcrumb[]> = new Map();

/**
 * Add a breadcrumb to a tab's trail
 */
export function addCrumb(tabId: string, url: string, title: string): Breadcrumb {
  const crumb: Breadcrumb = {
    url,
    title,
    timestamp: Date.now(),
  };

  const trail = trails.get(tabId) || [];
  
  // Don't add duplicate consecutive entries
  if (trail.length > 0 && trail[trail.length - 1].url === url) {
    // Update the title if it changed
    trail[trail.length - 1].title = title;
    trails.set(tabId, trail);
    return trail[trail.length - 1];
  }
  
  trail.push(crumb);
  trails.set(tabId, trail);
  
  return crumb;
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
 * Set a complete trail for a tab (used when restoring from Cookie Jar)
 */
export function setTrail(tabId: string, trail: Breadcrumb[]): void {
  trails.set(tabId, [...trail]);
}

/**
 * Get all trails (for debugging)
 */
export function getAllTrails(): Map<string, Breadcrumb[]> {
  return new Map(trails);
}

/**
 * Clear all trails (for testing)
 */
export function clearAllTrails(): void {
  trails.clear();
}

/**
 * Update the title of the last breadcrumb in a trail
 * (useful when page title loads after navigation)
 */
export function updateLastCrumbTitle(tabId: string, title: string): void {
  const trail = trails.get(tabId);
  if (trail && trail.length > 0) {
    trail[trail.length - 1].title = title;
    trails.set(tabId, trail);
  }
}
