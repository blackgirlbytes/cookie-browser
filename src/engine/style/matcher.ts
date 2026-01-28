/**
 * CSS Selector Matcher
 * Matches CSS selectors against DOM nodes
 */

import type { DOMNode } from '../html';
import type { Selector } from '../css';

/**
 * Check if a selector matches a DOM node
 */
export function matches(node: DOMNode, selector: Selector): boolean {
  if (node.type !== 'element') {
    return false;
  }

  switch (selector.type) {
    case 'universal':
      return true;

    case 'tag':
      return node.tagName === selector.value;

    case 'class': {
      const classes = node.attributes.get('class')?.split(/\s+/) ?? [];
      return classes.includes(selector.value);
    }

    case 'id':
      return node.attributes.get('id') === selector.value;

    case 'compound': {
      // All parts must match
      if (!selector.parts) return false;
      return selector.parts.every(part => matches(node, part));
    }

    default:
      return false;
  }
}

/**
 * Find all matching rules for a node from a stylesheet
 */
export function matchingRules(
  node: DOMNode,
  rules: Array<{ selectors: Selector[]; declarations: Array<{ property: string; value: string }> }>
): Array<{ selector: Selector; declarations: Array<{ property: string; value: string }> }> {
  const matched: Array<{ selector: Selector; declarations: Array<{ property: string; value: string }> }> = [];

  for (const rule of rules) {
    for (const selector of rule.selectors) {
      if (matches(node, selector)) {
        matched.push({
          selector,
          declarations: rule.declarations
        });
      }
    }
  }

  return matched;
}
