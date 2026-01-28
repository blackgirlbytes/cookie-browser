/**
 * Style Computation
 * Computes final styles for DOM nodes by applying CSS rules
 */

import type { DOMNode } from '../html';
import type { Stylesheet } from '../css';
import { matches } from './matcher';
import { calculateSpecificity, compareSpecificity, type Specificity } from './specificity';

/**
 * Properties that are inherited by default
 */
const INHERITED_PROPERTIES = new Set([
  'color',
  'font-family',
  'font-size',
  'font-style',
  'font-weight',
  'line-height',
  'text-align',
  'text-decoration',
  'text-transform',
  'visibility',
  'white-space',
  'word-spacing',
  'letter-spacing',
  'cursor',
]);

/**
 * Default browser styles for common elements
 */
const DEFAULT_STYLES: Record<string, Record<string, string>> = {
  // Block elements
  div: { display: 'block' },
  p: { display: 'block', 'margin-top': '1em', 'margin-bottom': '1em' },
  h1: { display: 'block', 'font-size': '2em', 'font-weight': 'bold', 'margin-top': '0.67em', 'margin-bottom': '0.67em' },
  h2: { display: 'block', 'font-size': '1.5em', 'font-weight': 'bold', 'margin-top': '0.83em', 'margin-bottom': '0.83em' },
  h3: { display: 'block', 'font-size': '1.17em', 'font-weight': 'bold', 'margin-top': '1em', 'margin-bottom': '1em' },
  h4: { display: 'block', 'font-weight': 'bold', 'margin-top': '1.33em', 'margin-bottom': '1.33em' },
  h5: { display: 'block', 'font-size': '0.83em', 'font-weight': 'bold', 'margin-top': '1.67em', 'margin-bottom': '1.67em' },
  h6: { display: 'block', 'font-size': '0.67em', 'font-weight': 'bold', 'margin-top': '2.33em', 'margin-bottom': '2.33em' },
  ul: { display: 'block', 'margin-top': '1em', 'margin-bottom': '1em', 'padding-left': '40px' },
  ol: { display: 'block', 'margin-top': '1em', 'margin-bottom': '1em', 'padding-left': '40px' },
  li: { display: 'list-item' },
  
  // Inline elements
  span: { display: 'inline' },
  a: { display: 'inline', color: 'blue', 'text-decoration': 'underline' },
  strong: { display: 'inline', 'font-weight': 'bold' },
  em: { display: 'inline', 'font-style': 'italic' },
  
  // Replaced elements
  img: { display: 'inline-block' },
};

/**
 * Base default styles applied to all elements
 */
const BASE_DEFAULTS: Record<string, string> = {
  display: 'inline',
  color: 'black',
  'background-color': 'transparent',
  'font-family': 'serif',
  'font-size': '16px',
  'font-weight': 'normal',
  'font-style': 'normal',
  margin: '0',
  padding: '0',
  border: 'none',
};

export interface StyleMap {
  [property: string]: string;
}

export interface StyledNode {
  node: DOMNode;
  styles: StyleMap;
  children: StyledNode[];
}

interface MatchedDeclaration {
  property: string;
  value: string;
  specificity: Specificity;
  order: number;
}

/**
 * Compute styles for a single node
 */
function computeNodeStyles(
  node: DOMNode,
  stylesheet: Stylesheet,
  inheritedStyles: StyleMap,
  ruleOrder: number[]
): { styles: StyleMap; nextOrder: number } {
  const styles: StyleMap = {};
  let order = ruleOrder[0] || 0;

  // 1. Start with inherited properties from parent
  for (const prop of INHERITED_PROPERTIES) {
    if (inheritedStyles[prop]) {
      styles[prop] = inheritedStyles[prop];
    }
  }

  // 2. Apply base defaults
  for (const [prop, value] of Object.entries(BASE_DEFAULTS)) {
    if (!styles[prop]) {
      styles[prop] = value;
    }
  }

  // 3. Apply element-specific defaults
  if (node.type === 'element' && node.tagName) {
    const elementDefaults = DEFAULT_STYLES[node.tagName];
    if (elementDefaults) {
      for (const [prop, value] of Object.entries(elementDefaults)) {
        styles[prop] = value;
      }
    }
  }

  // 4. Collect all matching declarations with their specificity
  const matchedDeclarations: MatchedDeclaration[] = [];

  for (const rule of stylesheet.rules) {
    for (const selector of rule.selectors) {
      if (matches(node, selector)) {
        const specificity = calculateSpecificity(selector);
        for (const decl of rule.declarations) {
          matchedDeclarations.push({
            property: decl.property,
            value: decl.value,
            specificity,
            order: order++
          });
        }
      }
    }
  }

  // 5. Sort by specificity, then by order (later wins)
  matchedDeclarations.sort((a, b) => {
    const specCompare = compareSpecificity(a.specificity, b.specificity);
    if (specCompare !== 0) return specCompare;
    return a.order - b.order;
  });

  // 6. Apply declarations in order (last one wins for same property)
  for (const decl of matchedDeclarations) {
    styles[decl.property] = decl.value;
  }

  ruleOrder[0] = order;
  return { styles, nextOrder: order };
}

/**
 * Build a styled tree from a DOM tree and stylesheet
 */
export function styleTree(dom: DOMNode, stylesheet: Stylesheet): StyledNode {
  const ruleOrder = [0];
  return styleNodeRecursive(dom, stylesheet, {}, ruleOrder);
}

function styleNodeRecursive(
  node: DOMNode,
  stylesheet: Stylesheet,
  inheritedStyles: StyleMap,
  ruleOrder: number[]
): StyledNode {
  // Compute styles for this node
  const { styles } = computeNodeStyles(node, stylesheet, inheritedStyles, ruleOrder);

  // Recursively style children
  const styledChildren: StyledNode[] = [];
  for (const child of node.children) {
    if (child.type === 'element' || child.type === 'text') {
      styledChildren.push(styleNodeRecursive(child, stylesheet, styles, ruleOrder));
    }
  }

  return {
    node,
    styles,
    children: styledChildren
  };
}

/**
 * Get computed style value for a property
 */
export function getComputedStyle(styledNode: StyledNode, property: string): string | undefined {
  return styledNode.styles[property];
}

/**
 * Check if a property is inherited
 */
export function isInheritedProperty(property: string): boolean {
  return INHERITED_PROPERTIES.has(property);
}
