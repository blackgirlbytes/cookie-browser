/**
 * HTML Parser Module
 * 
 * Provides functionality to parse HTML strings into a DOM tree structure.
 */

export { tokenize, type Token, type TokenType } from './tokenizer';
export { 
  parse, 
  getTextContent, 
  getElementsByTagName, 
  getElementById, 
  getElementsByClassName,
  type DOMNode, 
  type NodeType 
} from './parser';

// Main entry point - alias for parse
import { parse, type DOMNode } from './parser';

/**
 * Parse an HTML string into a DOM tree
 * 
 * @param html - The HTML string to parse
 * @returns A DOMNode representing the parsed HTML
 * 
 * @example
 * ```typescript
 * const dom = parseHTML('<div class="container"><p>Hello</p></div>');
 * console.log(dom.tagName); // 'div'
 * console.log(dom.children[0].tagName); // 'p'
 * ```
 */
export function parseHTML(html: string): DOMNode {
  return parse(html);
}
