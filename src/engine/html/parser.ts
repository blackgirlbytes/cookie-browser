/**
 * HTML Parser for Cookie Browser's custom rendering engine
 * Converts tokens into a DOM tree structure
 */

import { tokenize } from './tokenizer';

export type NodeType = 'element' | 'text' | 'comment' | 'document';

export interface DOMNode {
  type: NodeType;
  tagName?: string;
  attributes: Map<string, string>;
  children: DOMNode[];
  textContent?: string;
  parent?: DOMNode;
}

/**
 * Creates a new element node
 */
function createElement(tagName: string, attributes: Map<string, string> = new Map()): DOMNode {
  return {
    type: 'element',
    tagName,
    attributes,
    children: []
  };
}

/**
 * Creates a new text node
 */
function createTextNode(text: string): DOMNode {
  return {
    type: 'text',
    attributes: new Map(),
    children: [],
    textContent: text
  };
}

/**
 * Creates a document root node
 */
function createDocument(): DOMNode {
  return {
    type: 'document',
    attributes: new Map(),
    children: []
  };
}

/**
 * Parse HTML string into a DOM tree
 * Returns the root element, or a document node if multiple roots exist
 */
export function parseHTML(html: string): DOMNode {
  const tokens = tokenize(html);
  const root = createDocument();
  const stack: DOMNode[] = [root];
  
  for (const token of tokens) {
    const current = stack[stack.length - 1];
    
    switch (token.type) {
      case 'startTag': {
        const element = createElement(token.tagName!, token.attributes);
        element.parent = current;
        current.children.push(element);
        stack.push(element);
        break;
      }
      
      case 'selfClosingTag': {
        const element = createElement(token.tagName!, token.attributes);
        element.parent = current;
        current.children.push(element);
        // Don't push to stack - self-closing tags have no children
        break;
      }
      
      case 'endTag': {
        // Find matching start tag in stack
        for (let i = stack.length - 1; i > 0; i--) {
          if (stack[i].tagName === token.tagName) {
            // Pop everything up to and including the matching tag
            stack.length = i;
            break;
          }
        }
        // If no matching tag found, ignore the end tag (lenient parsing)
        break;
      }
      
      case 'text': {
        // Skip whitespace-only text nodes at root level
        const text = token.textContent || '';
        if (text.trim() || stack.length > 1) {
          const textNode = createTextNode(text);
          textNode.parent = current;
          current.children.push(textNode);
        }
        break;
      }
      
      case 'comment': {
        // Skip comments for now - could add support later
        break;
      }
      
      case 'doctype': {
        // Skip doctype - we don't need it for rendering
        break;
      }
    }
  }
  
  // If there's exactly one child element, return it as the root
  // Otherwise return the document node
  if (root.children.length === 1 && root.children[0].type === 'element') {
    const child = root.children[0];
    delete child.parent;
    return child;
  }
  
  // Clean up parent references for root children
  for (const child of root.children) {
    delete child.parent;
  }
  
  return root;
}

/**
 * Serialize a DOM node back to HTML string (useful for debugging)
 */
export function serializeHTML(node: DOMNode): string {
  if (node.type === 'text') {
    return node.textContent || '';
  }
  
  if (node.type === 'document') {
    return node.children.map(serializeHTML).join('');
  }
  
  if (node.type === 'element') {
    const attrs = Array.from(node.attributes.entries())
      .map(([k, v]) => `${k}="${v}"`)
      .join(' ');
    
    const attrStr = attrs ? ` ${attrs}` : '';
    const children = node.children.map(serializeHTML).join('');
    
    return `<${node.tagName}${attrStr}>${children}</${node.tagName}>`;
  }
  
  return '';
}
