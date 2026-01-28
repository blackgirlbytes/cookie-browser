/**
 * CSS Parser
 * Converts CSS tokens into a stylesheet structure
 */

import { tokenizeCSS } from './tokenizer';

export type SelectorType = 'tag' | 'class' | 'id' | 'universal' | 'compound';

export interface Selector {
  type: SelectorType;
  value: string;
  // For compound selectors (e.g., div.container#main)
  parts?: Selector[];
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
 * Parse a selector string into a Selector object
 */
function parseSelector(selectorStr: string): Selector {
  const trimmed = selectorStr.trim();
  
  // Universal selector
  if (trimmed === '*') {
    return { type: 'universal', value: '*' };
  }

  // Check for compound selector (has multiple parts)
  // Match patterns like: tag, .class, #id, tag.class, tag#id, .class1.class2, etc.
  const parts: Selector[] = [];
  let remaining = trimmed;
  
  // First, check if it starts with a tag name
  const tagMatch = remaining.match(/^([a-zA-Z][a-zA-Z0-9-]*)/);
  if (tagMatch) {
    parts.push({ type: 'tag', value: tagMatch[1].toLowerCase() });
    remaining = remaining.slice(tagMatch[1].length);
  }

  // Then parse class and id selectors
  while (remaining.length > 0) {
    if (remaining[0] === '.') {
      const classMatch = remaining.match(/^\.([a-zA-Z_-][a-zA-Z0-9_-]*)/);
      if (classMatch) {
        parts.push({ type: 'class', value: classMatch[1] });
        remaining = remaining.slice(classMatch[0].length);
        continue;
      }
    }
    
    if (remaining[0] === '#') {
      const idMatch = remaining.match(/^#([a-zA-Z_-][a-zA-Z0-9_-]*)/);
      if (idMatch) {
        parts.push({ type: 'id', value: idMatch[1] });
        remaining = remaining.slice(idMatch[0].length);
        continue;
      }
    }

    // If we can't parse more, break
    break;
  }

  // If only one part, return it directly
  if (parts.length === 1) {
    return parts[0];
  }

  // If multiple parts, return as compound
  if (parts.length > 1) {
    return {
      type: 'compound',
      value: trimmed,
      parts
    };
  }

  // Fallback: check for standalone class or id
  if (trimmed.startsWith('.')) {
    return { type: 'class', value: trimmed.slice(1) };
  }
  
  if (trimmed.startsWith('#')) {
    return { type: 'id', value: trimmed.slice(1) };
  }

  // Default to tag selector
  return { type: 'tag', value: trimmed.toLowerCase() };
}

/**
 * Parse a selector list (comma-separated selectors)
 */
function parseSelectorList(selectorStr: string): Selector[] {
  return selectorStr
    .split(',')
    .map(s => s.trim())
    .filter(s => s.length > 0)
    .map(parseSelector);
}

/**
 * Parse a CSS string into a Stylesheet
 */
export function parse(css: string): Stylesheet {
  const tokens = tokenizeCSS(css);
  const rules: Rule[] = [];
  
  let i = 0;
  
  while (i < tokens.length) {
    const token = tokens[i];
    
    // Skip comments
    if (token.type === 'comment') {
      i++;
      continue;
    }

    // Look for selector
    if (token.type === 'selector') {
      const selectors = parseSelectorList(token.value);
      const declarations: Declaration[] = [];
      
      i++; // Move past selector
      
      // Expect open brace
      if (tokens[i]?.type === 'openBrace') {
        i++; // Move past {
        
        // Read declarations until close brace
        while (i < tokens.length && tokens[i].type !== 'closeBrace') {
          // Skip comments
          if (tokens[i].type === 'comment') {
            i++;
            continue;
          }

          // Expect property
          if (tokens[i].type === 'property') {
            const property = tokens[i].value;
            i++;
            
            // Expect colon
            if (tokens[i]?.type === 'colon') {
              i++;
              
              // Expect value
              if (tokens[i]?.type === 'value') {
                const value = tokens[i].value;
                declarations.push({ property, value });
                i++;
                
                // Skip optional semicolon
                if (tokens[i]?.type === 'semicolon') {
                  i++;
                }
              }
            }
          } else {
            i++; // Skip unexpected token
          }
        }
        
        // Skip close brace
        if (tokens[i]?.type === 'closeBrace') {
          i++;
        }
      }
      
      if (selectors.length > 0) {
        rules.push({ selectors, declarations });
      }
    } else {
      i++; // Skip unexpected token
    }
  }

  return { rules };
}

/**
 * Stringify a stylesheet back to CSS (for debugging)
 */
export function stringify(stylesheet: Stylesheet): string {
  return stylesheet.rules.map(rule => {
    const selectors = rule.selectors.map(s => {
      if (s.type === 'class') return `.${s.value}`;
      if (s.type === 'id') return `#${s.value}`;
      return s.value;
    }).join(', ');
    
    const declarations = rule.declarations
      .map(d => `  ${d.property}: ${d.value};`)
      .join('\n');
    
    return `${selectors} {\n${declarations}\n}`;
  }).join('\n\n');
}
