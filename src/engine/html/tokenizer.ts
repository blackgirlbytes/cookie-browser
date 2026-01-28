/**
 * HTML Tokenizer
 * Converts an HTML string into a stream of tokens
 */

export type TokenType = 
  | 'startTag'
  | 'endTag'
  | 'selfClosingTag'
  | 'text'
  | 'comment'
  | 'doctype';

export interface Token {
  type: TokenType;
  tagName?: string;
  attributes?: Map<string, string>;
  textContent?: string;
}

// Self-closing tags that don't need explicit />
const VOID_ELEMENTS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr'
]);

export function tokenize(html: string): Token[] {
  const tokens: Token[] = [];
  let pos = 0;

  while (pos < html.length) {
    if (html[pos] === '<') {
      // Check for comment
      if (html.slice(pos, pos + 4) === '<!--') {
        const endComment = html.indexOf('-->', pos + 4);
        if (endComment !== -1) {
          tokens.push({
            type: 'comment',
            textContent: html.slice(pos + 4, endComment)
          });
          pos = endComment + 3;
          continue;
        }
      }

      // Check for doctype
      if (html.slice(pos, pos + 9).toLowerCase() === '<!doctype') {
        const endDoctype = html.indexOf('>', pos);
        if (endDoctype !== -1) {
          tokens.push({
            type: 'doctype',
            textContent: html.slice(pos + 9, endDoctype).trim()
          });
          pos = endDoctype + 1;
          continue;
        }
      }

      // Check for end tag
      if (html[pos + 1] === '/') {
        const endTag = html.indexOf('>', pos);
        if (endTag !== -1) {
          const tagName = html.slice(pos + 2, endTag).trim().toLowerCase();
          tokens.push({
            type: 'endTag',
            tagName
          });
          pos = endTag + 1;
          continue;
        }
      }

      // Start tag or self-closing tag
      const tagEnd = html.indexOf('>', pos);
      if (tagEnd !== -1) {
        const tagContent = html.slice(pos + 1, tagEnd);
        const isSelfClosing = tagContent.endsWith('/');
        const cleanContent = isSelfClosing ? tagContent.slice(0, -1).trim() : tagContent.trim();
        
        // Parse tag name and attributes
        const { tagName, attributes } = parseTagContent(cleanContent);
        const lowerTagName = tagName.toLowerCase();
        
        // Determine if it's self-closing (explicit or void element)
        const isVoid = VOID_ELEMENTS.has(lowerTagName);
        
        if (isSelfClosing || isVoid) {
          tokens.push({
            type: 'selfClosingTag',
            tagName: lowerTagName,
            attributes
          });
        } else {
          tokens.push({
            type: 'startTag',
            tagName: lowerTagName,
            attributes
          });
        }
        
        pos = tagEnd + 1;
        continue;
      }
    }

    // Text content
    const nextTag = html.indexOf('<', pos);
    const textEnd = nextTag === -1 ? html.length : nextTag;
    const text = html.slice(pos, textEnd);
    
    // Only add non-empty text (but preserve whitespace-only text for now)
    if (text.length > 0) {
      tokens.push({
        type: 'text',
        textContent: text
      });
    }
    
    pos = textEnd;
  }

  return tokens;
}

function parseTagContent(content: string): { tagName: string; attributes: Map<string, string> } {
  const attributes = new Map<string, string>();
  
  // Find the tag name (first word)
  const firstSpace = content.search(/\s/);
  const tagName = firstSpace === -1 ? content : content.slice(0, firstSpace);
  
  if (firstSpace === -1) {
    return { tagName, attributes };
  }

  // Parse attributes
  const attrString = content.slice(firstSpace).trim();
  const attrRegex = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  
  let match;
  while ((match = attrRegex.exec(attrString)) !== null) {
    const name = match[1].toLowerCase();
    // Value can be in double quotes, single quotes, unquoted, or absent (boolean attribute)
    const value = match[2] ?? match[3] ?? match[4] ?? '';
    attributes.set(name, value);
  }

  return { tagName, attributes };
}
