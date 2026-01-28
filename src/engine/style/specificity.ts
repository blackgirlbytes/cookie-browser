/**
 * CSS Specificity Calculator
 * 
 * Specificity is calculated as (a, b, c) where:
 * - a = number of ID selectors
 * - b = number of class selectors, attribute selectors, and pseudo-classes
 * - c = number of type selectors and pseudo-elements
 * 
 * Higher specificity wins. Comparison is done left to right.
 */

import type { Selector } from '../css';

export interface Specificity {
  a: number; // ID selectors
  b: number; // Class selectors
  c: number; // Type selectors
}

/**
 * Calculate specificity for a selector
 */
export function calculateSpecificity(selector: Selector): Specificity {
  const specificity: Specificity = { a: 0, b: 0, c: 0 };

  switch (selector.type) {
    case 'id':
      specificity.a = 1;
      break;

    case 'class':
      specificity.b = 1;
      break;

    case 'tag':
      specificity.c = 1;
      break;

    case 'universal':
      // Universal selector has no specificity
      break;

    case 'compound':
      // Sum up specificity of all parts
      if (selector.parts) {
        for (const part of selector.parts) {
          const partSpec = calculateSpecificity(part);
          specificity.a += partSpec.a;
          specificity.b += partSpec.b;
          specificity.c += partSpec.c;
        }
      }
      break;
  }

  return specificity;
}

/**
 * Compare two specificities
 * Returns positive if a > b, negative if a < b, 0 if equal
 */
export function compareSpecificity(a: Specificity, b: Specificity): number {
  // Compare a (IDs) first
  if (a.a !== b.a) {
    return a.a - b.a;
  }
  // Then compare b (classes)
  if (a.b !== b.b) {
    return a.b - b.b;
  }
  // Finally compare c (types)
  return a.c - b.c;
}

/**
 * Convert specificity to a comparable number
 * This is a simplified approach - each component gets a "weight"
 */
export function specificityToNumber(spec: Specificity): number {
  // Using base 100 to ensure no overflow between categories
  return spec.a * 10000 + spec.b * 100 + spec.c;
}
