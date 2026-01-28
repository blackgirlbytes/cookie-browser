/**
 * HTML Parser
 * Converts tokens into a DOM tree structure
 */

import { tokenize } from './tokenizer';

export type NodeType = 'element' | 'text' | 'comment' | 'document' | 'doctype';

export interface DOMNode {
  type: NodeType;
  tagName?: string;
  attributes: Map<string, string>;
  children: DOMNode[];
  textContent?: string;
  parent?: DOMNode;
}

/**
 * Create a new element node
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
 * Create a new text node
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
 * Create a new comment node
 */
function createCommentNode(text: string): DOMNode {
  return {
    type: 'comment',
    attributes: new Map(),
    children: [],
    textContent: text
  };
}

/**
 * Parse HTML string into a DOM tree
 * Returns a single root node. If there are multiple root elements,
 * they are wrapped in a document fragment-like root.
 */
export function parse(html: string): DOMNode {
  const tokens = tokenize(html);
  
  // Create a root document node to hold everything
  const root: DOMNode = {
    type: 'document',
    attributes: new Map(),
    children: []
  };

  // Stack to track current nesting level
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
        // Don't push to stack since it's self-closing
        break;
      }

      case 'endTag': {
        // Find matching start tag in stack
        let found = false;
        for (let i = stack.length - 1; i > 0; i--) {
          if (stack[i].tagName === token.tagName) {
            // Pop everything up to and including the matching tag
            stack.length = i;
            found = true;
            break;
          }
        }
        // If no matching tag found, ignore the end tag (error recovery)
        if (!found) {
          // Silently ignore mismatched end tags
        }
        break;
      }

      case 'text': {
        // Skip whitespace-only text nodes at document level
        const trimmed = token.textContent!.trim();
        if (current.type === 'document' && trimmed === '') {
          break;
        }
        const textNode = createTextNode(token.textContent!);
        textNode.parent = current;
        current.children.push(textNode);
        break;
      }

      case 'comment': {
        const commentNode = createCommentNode(token.textContent!);
        commentNode.parent = current;
        current.children.push(commentNode);
        break;
      }

      case 'doctype': {
        // Just note that we saw a doctype, don't add to tree
        break;
      }
    }
  }

  // If there's exactly one child element, return it directly
  // Otherwise return the document wrapper
  const elementChildren = root.children.filter(c => c.type === 'element');
  if (elementChildren.length === 1 && root.children.length === 1) {
    const child = elementChildren[0];
    child.parent = undefined;
    return child;
  }

  return root;
}

/**
 * Utility to get text content of a node and all its descendants
 */
export function getTextContent(node: DOMNode): string {
  if (node.type === 'text') {
    return node.textContent ?? '';
  }
  
  return node.children.map(getTextContent).join('');
}

/**
 * Utility to find elements by tag name
 */
export function getElementsByTagName(node: DOMNode, tagName: string): DOMNode[] {
  const results: DOMNode[] = [];
  const lowerTagName = tagName.toLowerCase();

  function traverse(n: DOMNode) {
    if (n.type === 'element' && n.tagName === lowerTagName) {
      results.push(n);
    }
    for (const child of n.children) {
      traverse(child);
    }
  }

  traverse(node);
  return results;
}

/**
 * Utility to find element by ID
 */
export function getElementById(node: DOMNode, id: string): DOMNode | null {
  function traverse(n: DOMNode): DOMNode | null {
    if (n.type === 'element' && n.attributes.get('id') === id) {
      return n;
    }
    for (const child of n.children) {
      const found = traverse(child);
      if (found) return found;
    }
    return null;
  }

  return traverse(node);
}

/**
 * Utility to find elements by class name
 */
export function getElementsByClassName(node: DOMNode, className: string): DOMNode[] {
  const results: DOMNode[] = [];

  function traverse(n: DOMNode) {
    if (n.type === 'element') {
      const classes = n.attributes.get('class')?.split(/\s+/) ?? [];
      if (classes.includes(className)) {
        results.push(n);
      }
    }
    for (const child of n.children) {
      traverse(child);
    }
  }

  traverse(node);
  return results;
}
