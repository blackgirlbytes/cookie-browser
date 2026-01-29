/**
 * CSS Selector Matcher for Cookie Browser's custom rendering engine
 * Matches CSS selectors to DOM nodes
 */

import type { DOMNode } from '../html';
import type { Selector } from '../css';

/**
 * Check if a selector matches a DOM node
 */
export function matchesSelector(node: DOMNode, selector: Selector): boolean {
  if (node.type !== 'element') {
    return false;
  }

  switch (selector.type) {
    case 'universal':
      return true;

    case 'tag':
      return node.tagName === selector.value;

    case 'class': {
      const classAttr = node.attributes.get('class');
      if (!classAttr) return false;
      const classes = classAttr.split(/\s+/);
      return classes.includes(selector.value);
    }

    case 'id': {
      const idAttr = node.attributes.get('id');
      return idAttr === selector.value;
    }

    default:
      return false;
  }
}

/**
 * Check if any selector in a list matches a DOM node
 */
export function matchesAnySelector(node: DOMNode, selectors: Selector[]): boolean {
  return selectors.some(selector => matchesSelector(node, selector));
}
