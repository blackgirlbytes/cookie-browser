/**
 * Style Computation for Cookie Browser's custom rendering engine
 * Computes final styles for DOM nodes by applying CSS rules
 */

import type { DOMNode } from '../html';
import type { Stylesheet, Rule, Declaration } from '../css';
import { matchesAnySelector } from './matcher';
import { calculateCombinedSpecificity, compareSpecificity, type Specificity } from './specificity';

/**
 * Computed styles for a node
 */
export type ComputedStyles = Map<string, string>;

/**
 * A styled node - DOM node with computed styles
 */
export interface StyledNode {
  node: DOMNode;
  styles: ComputedStyles;
  children: StyledNode[];
}

/**
 * Properties that are inherited from parent to child
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
 * Default browser styles
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
  b: { display: 'inline', 'font-weight': 'bold' },
  em: { display: 'inline', 'font-style': 'italic' },
  i: { display: 'inline', 'font-style': 'italic' },
  
  // Replaced elements
  img: { display: 'inline-block' },
  br: { display: 'inline' },
  hr: { display: 'block', 'margin-top': '0.5em', 'margin-bottom': '0.5em', 'border-top': '1px solid gray' },
};

/**
 * Global default styles
 */
const GLOBAL_DEFAULTS: Record<string, string> = {
  'color': 'black',
  'background': 'transparent',
  'font-family': 'serif',
  'font-size': '16px',
  'font-weight': 'normal',
  'font-style': 'normal',
  'display': 'inline',
};

interface MatchedRule {
  rule: Rule;
  specificity: Specificity;
}

/**
 * Get all rules that match a node
 */
function getMatchingRules(node: DOMNode, stylesheet: Stylesheet): MatchedRule[] {
  const matched: MatchedRule[] = [];

  for (const rule of stylesheet.rules) {
    if (matchesAnySelector(node, rule.selectors)) {
      matched.push({
        rule,
        specificity: calculateCombinedSpecificity(rule.selectors),
      });
    }
  }

  return matched;
}

/**
 * Apply declarations to styles, respecting specificity
 */
function applyDeclarations(
  styles: ComputedStyles,
  declarations: Declaration[],
  specificity: Specificity,
  existingSpecificities: Map<string, Specificity>
): void {
  for (const decl of declarations) {
    const existingSpec = existingSpecificities.get(decl.property);
    
    // Apply if no existing value or higher/equal specificity
    if (!existingSpec || compareSpecificity(specificity, existingSpec) >= 0) {
      styles.set(decl.property, decl.value);
      existingSpecificities.set(decl.property, specificity);
    }
  }
}

/**
 * Compute styles for a single node
 */
function computeNodeStyles(
  node: DOMNode,
  stylesheet: Stylesheet,
  parentStyles: ComputedStyles | null
): ComputedStyles {
  const styles = new Map<string, string>();
  const specificities = new Map<string, Specificity>();

  // 1. Apply global defaults
  for (const [prop, value] of Object.entries(GLOBAL_DEFAULTS)) {
    styles.set(prop, value);
    specificities.set(prop, { a: 0, b: 0, c: 0 });
  }

  // 2. Apply inherited properties from parent
  if (parentStyles) {
    for (const prop of INHERITED_PROPERTIES) {
      const parentValue = parentStyles.get(prop);
      if (parentValue) {
        styles.set(prop, parentValue);
        // Inherited values have lowest specificity
        specificities.set(prop, { a: 0, b: 0, c: 0 });
      }
    }
  }

  // 3. Apply browser default styles for this element type
  if (node.type === 'element' && node.tagName) {
    const defaults = DEFAULT_STYLES[node.tagName];
    if (defaults) {
      for (const [prop, value] of Object.entries(defaults)) {
        styles.set(prop, value);
        // Browser defaults have very low specificity
        specificities.set(prop, { a: 0, b: 0, c: 0 });
      }
    }
  }

  // 4. Apply matching CSS rules (sorted by specificity)
  const matchedRules = getMatchingRules(node, stylesheet);
  
  // Sort by specificity (lower first, so higher overwrites)
  matchedRules.sort((a, b) => compareSpecificity(a.specificity, b.specificity));

  for (const { rule, specificity } of matchedRules) {
    applyDeclarations(styles, rule.declarations, specificity, specificities);
  }

  // 5. Apply inline styles (highest specificity)
  const styleAttr = node.attributes.get('style');
  if (styleAttr) {
    const inlineDeclarations = parseInlineStyles(styleAttr);
    const inlineSpecificity: Specificity = { a: 1, b: 0, c: 0 }; // Inline styles beat everything
    applyDeclarations(styles, inlineDeclarations, inlineSpecificity, specificities);
  }

  return styles;
}

/**
 * Parse inline style attribute
 */
function parseInlineStyles(styleAttr: string): Declaration[] {
  const declarations: Declaration[] = [];
  const parts = styleAttr.split(';');

  for (const part of parts) {
    const colonIndex = part.indexOf(':');
    if (colonIndex !== -1) {
      const property = part.slice(0, colonIndex).trim();
      const value = part.slice(colonIndex + 1).trim();
      if (property && value) {
        declarations.push({ property, value });
      }
    }
  }

  return declarations;
}

/**
 * Build a styled tree from a DOM tree and stylesheet
 */
export function styleTree(dom: DOMNode, stylesheet: Stylesheet): StyledNode {
  return styleNodeRecursive(dom, stylesheet, null);
}

function styleNodeRecursive(
  node: DOMNode,
  stylesheet: Stylesheet,
  parentStyles: ComputedStyles | null
): StyledNode {
  const styles = computeNodeStyles(node, stylesheet, parentStyles);

  const styledChildren = node.children.map(child =>
    styleNodeRecursive(child, stylesheet, styles)
  );

  return {
    node,
    styles,
    children: styledChildren,
  };
}

/**
 * Helper to get a style value with a default
 */
export function getStyle(styles: ComputedStyles, property: string, defaultValue: string = ''): string {
  return styles.get(property) ?? defaultValue;
}
