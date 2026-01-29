/**
 * Style Resolution module for Cookie Browser's custom rendering engine
 * 
 * Usage:
 *   import { styleTree } from './engine/style';
 *   const styledDom = styleTree(dom, stylesheet);
 */

export { matchesSelector, matchesAnySelector } from './matcher';
export { 
  calculateSpecificity, 
  calculateCombinedSpecificity, 
  compareSpecificity,
  specificityGreaterOrEqual 
} from './specificity';
export type { Specificity } from './specificity';
export { styleTree, getStyle } from './compute';
export type { StyledNode, ComputedStyles } from './compute';
