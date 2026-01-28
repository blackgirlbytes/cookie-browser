/**
 * Style Resolution Module
 * 
 * Matches CSS rules to DOM nodes and computes final styles.
 */

export { matches, matchingRules } from './matcher';
export { calculateSpecificity, compareSpecificity, specificityToNumber, type Specificity } from './specificity';
export { styleTree, getComputedStyle, isInheritedProperty, type StyleMap, type StyledNode } from './compute';
