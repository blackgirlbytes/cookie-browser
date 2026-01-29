/**
 * CSS Tokenizer for Cookie Browser's custom rendering engine
 * Converts CSS strings into a stream of tokens
 */

export type CSSTokenType =
  | 'selector'
  | 'openBrace'
  | 'closeBrace'
  | 'property'
  | 'value'
  | 'colon'
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
  let inRule = false;
  let expectingValue = false;

  while (pos < css.length) {
    // Skip whitespace
    if (/\s/.test(css[pos])) {
      pos++;
      continue;
    }

    // Handle comments
    if (css.slice(pos, pos + 2) === '/*') {
      const endComment = css.indexOf('*/', pos + 2);
      if (endComment !== -1) {
        tokens.push({
          type: 'comment',
          value: css.slice(pos + 2, endComment).trim()
        });
        pos = endComment + 2;
        continue;
      }
    }

    // Open brace - start of rule body
    if (css[pos] === '{') {
      tokens.push({ type: 'openBrace', value: '{' });
      inRule = true;
      expectingValue = false;
      pos++;
      continue;
    }

    // Close brace - end of rule body
    if (css[pos] === '}') {
      tokens.push({ type: 'closeBrace', value: '}' });
      inRule = false;
      expectingValue = false;
      pos++;
      continue;
    }

    // Colon - separates property from value
    if (css[pos] === ':' && inRule) {
      tokens.push({ type: 'colon', value: ':' });
      expectingValue = true;
      pos++;
      continue;
    }

    // Semicolon - ends declaration
    if (css[pos] === ';') {
      tokens.push({ type: 'semicolon', value: ';' });
      expectingValue = false;
      pos++;
      continue;
    }

    // If we're not in a rule, this must be a selector
    if (!inRule) {
      let selector = '';
      while (pos < css.length && css[pos] !== '{') {
        selector += css[pos];
        pos++;
      }
      selector = selector.trim();
      if (selector) {
        tokens.push({ type: 'selector', value: selector });
      }
      continue;
    }

    // Inside a rule - either property or value
    if (inRule) {
      if (expectingValue) {
        // Read value until semicolon or close brace
        let value = '';
        while (pos < css.length && css[pos] !== ';' && css[pos] !== '}') {
          value += css[pos];
          pos++;
        }
        value = value.trim();
        if (value) {
          tokens.push({ type: 'value', value });
        }
        expectingValue = false;
      } else {
        // Read property until colon
        let property = '';
        while (pos < css.length && css[pos] !== ':' && css[pos] !== '}') {
          property += css[pos];
          pos++;
        }
        property = property.trim();
        if (property) {
          tokens.push({ type: 'property', value: property });
        }
      }
      continue;
    }

    pos++;
  }

  return tokens;
}
