/**
 * HTML Parser module for Cookie Browser's custom rendering engine
 * 
 * Usage:
 *   import { parseHTML } from './engine/html';
 *   const dom = parseHTML('<div class="container">Hello</div>');
 */

export { tokenize } from './tokenizer';
export type { Token, TokenType } from './tokenizer';
export { parseHTML, serializeHTML } from './parser';
export type { DOMNode, NodeType } from './parser';
