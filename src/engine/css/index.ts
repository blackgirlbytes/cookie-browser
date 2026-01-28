/**
 * CSS Parser Module
 * 
 * Provides functionality to parse CSS strings into a stylesheet structure.
 */

export { tokenizeCSS, type CSSToken, type CSSTokenType } from './tokenizer';
export { 
  parse, 
  stringify,
  type Selector, 
  type SelectorType,
  type Declaration, 
  type Rule, 
  type Stylesheet 
} from './parser';

// Main entry point - alias for parse
import { parse, type Stylesheet } from './parser';

/**
 * Parse a CSS string into a Stylesheet
 * 
 * @param css - The CSS string to parse
 * @returns A Stylesheet object containing parsed rules
 * 
 * @example
 * ```typescript
 * const stylesheet = parseCSS('.container { width: 100%; color: red; }');
 * console.log(stylesheet.rules[0].selectors[0].type); // 'class'
 * console.log(stylesheet.rules[0].declarations[0].property); // 'width'
 * ```
 */
export function parseCSS(css: string): Stylesheet {
  return parse(css);
}
