/**
 * CSS Specificity Calculator for Cookie Browser's custom rendering engine
 * Calculates specificity for CSS selectors
 * 
 * Specificity is calculated as (a, b, c) where:
 * - a = number of ID selectors
 * - b = number of class selectors, attribute selectors, and pseudo-classes
 * - c = number of type selectors and pseudo-elements
 */

import type { Selector } from '../css';

export interface Specificity {
  a: number; // ID selectors
  b: number; // Class selectors
  c: number; // Tag selectors
}

/**
 * Calculate specificity for a single selector
 */
export function calculateSpecificity(selector: Selector): Specificity {
  switch (selector.type) {
    case 'id':
      return { a: 1, b: 0, c: 0 };
    case 'class':
      return { a: 0, b: 1, c: 0 };
    case 'tag':
      return { a: 0, b: 0, c: 1 };
    case 'universal':
      return { a: 0, b: 0, c: 0 };
    default:
      return { a: 0, b: 0, c: 0 };
  }
}

/**
 * Calculate combined specificity for multiple selectors
 * (used when a rule has comma-separated selectors)
 */
export function calculateCombinedSpecificity(selectors: Selector[]): Specificity {
  // For comma-separated selectors, we use the highest specificity
  // But for our simple case, we just sum them
  return selectors.reduce(
    (acc, selector) => {
      const spec = calculateSpecificity(selector);
      return {
        a: acc.a + spec.a,
        b: acc.b + spec.b,
        c: acc.c + spec.c,
      };
    },
    { a: 0, b: 0, c: 0 }
  );
}

/**
 * Compare two specificities
 * Returns:
 *  - positive number if spec1 > spec2
 *  - negative number if spec1 < spec2
 *  - 0 if equal
 */
export function compareSpecificity(spec1: Specificity, spec2: Specificity): number {
  // Compare a (ID selectors) first
  if (spec1.a !== spec2.a) {
    return spec1.a - spec2.a;
  }
  // Then b (class selectors)
  if (spec1.b !== spec2.b) {
    return spec1.b - spec2.b;
  }
  // Finally c (tag selectors)
  return spec1.c - spec2.c;
}

/**
 * Check if spec1 is greater than or equal to spec2
 */
export function specificityGreaterOrEqual(spec1: Specificity, spec2: Specificity): boolean {
  return compareSpecificity(spec1, spec2) >= 0;
}
