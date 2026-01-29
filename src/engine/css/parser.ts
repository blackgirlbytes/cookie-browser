/**
 * CSS Parser for Cookie Browser's custom rendering engine
 * Converts CSS tokens into a stylesheet structure
 */

import { tokenizeCSS } from './tokenizer';

export type SelectorType = 'tag' | 'class' | 'id' | 'universal';

export interface Selector {
  type: SelectorType;
  value: string;
}

export interface Declaration {
  property: string;
  value: string;
}

export interface Rule {
  selectors: Selector[];
  declarations: Declaration[];
}

export interface Stylesheet {
  rules: Rule[];
}

/**
 * Parse a selector string into Selector objects
 * Handles comma-separated selectors like "div, .class, #id"
 */
function parseSelectors(selectorStr: string): Selector[] {
  const selectors: Selector[] = [];
  const parts = selectorStr.split(',').map(s => s.trim()).filter(s => s);

  for (const part of parts) {
    // Handle each selector part
    // For now, we only support simple selectors (not combinators)
    const selector = parseSingleSelector(part);
    if (selector) {
      selectors.push(selector);
    }
  }

  return selectors;
}

/**
 * Parse a single selector (no commas)
 */
function parseSingleSelector(selector: string): Selector | null {
  selector = selector.trim();
  
  if (!selector) {
    return null;
  }

  // Universal selector
  if (selector === '*') {
    return { type: 'universal', value: '*' };
  }

  // ID selector
  if (selector.startsWith('#')) {
    return { type: 'id', value: selector.slice(1) };
  }

  // Class selector
  if (selector.startsWith('.')) {
    return { type: 'class', value: selector.slice(1) };
  }

  // Tag selector (default)
  return { type: 'tag', value: selector.toLowerCase() };
}

/**
 * Parse a CSS string into a Stylesheet
 */
export function parseCSS(css: string): Stylesheet {
  const tokens = tokenizeCSS(css);
  const rules: Rule[] = [];
  
  let i = 0;
  while (i < tokens.length) {
    const token = tokens[i];

    // Look for selector
    if (token.type === 'selector') {
      const selectors = parseSelectors(token.value);
      const declarations: Declaration[] = [];

      // Skip to open brace
      i++;
      while (i < tokens.length && tokens[i].type !== 'openBrace') {
        i++;
      }
      i++; // Skip open brace

      // Parse declarations until close brace
      while (i < tokens.length && tokens[i].type !== 'closeBrace') {
        if (tokens[i].type === 'property') {
          const property = tokens[i].value;
          i++; // Move past property

          // Skip colon
          if (i < tokens.length && tokens[i].type === 'colon') {
            i++;
          }

          // Get value
          if (i < tokens.length && tokens[i].type === 'value') {
            declarations.push({
              property,
              value: tokens[i].value
            });
            i++;
          }

          // Skip semicolon
          if (i < tokens.length && tokens[i].type === 'semicolon') {
            i++;
          }
        } else {
          i++;
        }
      }

      // Skip close brace
      if (i < tokens.length && tokens[i].type === 'closeBrace') {
        i++;
      }

      if (selectors.length > 0) {
        rules.push({ selectors, declarations });
      }
    } else {
      i++;
    }
  }

  return { rules };
}

/**
 * Serialize a stylesheet back to CSS string (useful for debugging)
 */
export function serializeCSS(stylesheet: Stylesheet): string {
  return stylesheet.rules.map(rule => {
    const selectors = rule.selectors.map(s => {
      switch (s.type) {
        case 'id': return `#${s.value}`;
        case 'class': return `.${s.value}`;
        default: return s.value;
      }
    }).join(', ');

    const declarations = rule.declarations
      .map(d => `  ${d.property}: ${d.value};`)
      .join('\n');

    return `${selectors} {\n${declarations}\n}`;
  }).join('\n\n');
}
