/**
 * CSS Tokenizer
 * Converts a CSS string into a stream of tokens
 */

export type CSSTokenType =
  | 'selector'
  | 'openBrace'
  | 'closeBrace'
  | 'property'
  | 'colon'
  | 'value'
  | 'semicolon'
  | 'comment';

export interface CSSToken {
  type: CSSTokenType;
  value: string;
}

/**
 * Tokenize a CSS string into tokens
 */
export function tokenizeCSS(css: string): CSSToken[] {
  const tokens: CSSToken[] = [];
  let pos = 0;

  // Helper to skip whitespace
  const skipWhitespace = () => {
    while (pos < css.length && /\s/.test(css[pos])) {
      pos++;
    }
  };

  // Helper to read until a character
  const readUntil = (chars: string): string => {
    const start = pos;
    while (pos < css.length && !chars.includes(css[pos])) {
      pos++;
    }
    return css.slice(start, pos);
  };

  while (pos < css.length) {
    skipWhitespace();
    if (pos >= css.length) break;

    // Check for comments
    if (css[pos] === '/' && css[pos + 1] === '*') {
      const start = pos;
      pos += 2;
      while (pos < css.length - 1 && !(css[pos] === '*' && css[pos + 1] === '/')) {
        pos++;
      }
      pos += 2; // Skip */
      tokens.push({ type: 'comment', value: css.slice(start, pos) });
      continue;
    }

    // Open brace
    if (css[pos] === '{') {
      tokens.push({ type: 'openBrace', value: '{' });
      pos++;
      continue;
    }

    // Close brace
    if (css[pos] === '}') {
      tokens.push({ type: 'closeBrace', value: '}' });
      pos++;
      continue;
    }

    // Colon
    if (css[pos] === ':') {
      tokens.push({ type: 'colon', value: ':' });
      pos++;
      continue;
    }

    // Semicolon
    if (css[pos] === ';') {
      tokens.push({ type: 'semicolon', value: ';' });
      pos++;
      continue;
    }

    // Determine context: are we inside a rule block or outside?
    // Look back to find if we're after an open brace without a matching close
    const openBraces = tokens.filter(t => t.type === 'openBrace').length;
    const closeBraces = tokens.filter(t => t.type === 'closeBrace').length;
    const insideBlock = openBraces > closeBraces;

    if (insideBlock) {
      // Inside a declaration block - read property or value
      const lastToken = tokens[tokens.length - 1];
      
      if (lastToken?.type === 'colon' || lastToken?.type === 'semicolon' || lastToken?.type === 'openBrace') {
        // After colon = value, after semicolon or open brace = property
        if (lastToken.type === 'colon') {
          // Read value until semicolon or close brace
          const value = readUntil(';}\n').trim();
          if (value) {
            tokens.push({ type: 'value', value });
          }
        } else {
          // Read property until colon
          const property = readUntil(':}').trim();
          if (property) {
            tokens.push({ type: 'property', value: property });
          }
        }
      } else if (lastToken?.type === 'value') {
        // After a value, expect property
        const property = readUntil(':}').trim();
        if (property) {
          tokens.push({ type: 'property', value: property });
        }
      } else {
        // Default: read as property
        const property = readUntil(':}').trim();
        if (property) {
          tokens.push({ type: 'property', value: property });
        }
      }
    } else {
      // Outside block - read selector until open brace
      const selector = readUntil('{').trim();
      if (selector) {
        tokens.push({ type: 'selector', value: selector });
      }
    }
  }

  return tokens;
}
