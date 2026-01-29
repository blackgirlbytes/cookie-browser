/**
 * Tests for HTML Parser
 * Cookie Browser's custom rendering engine
 */

import { describe, test, expect } from 'vitest';
import { parseHTML } from '../index';
import type { DOMNode } from '../index';
import { tokenize } from '../tokenizer';

describe('HTML Tokenizer', () => {
  test('tokenizes simple element', () => {
    const tokens = tokenize('<div>Hello</div>');
    expect(tokens).toHaveLength(3);
    expect(tokens[0].type).toBe('startTag');
    expect(tokens[0].tagName).toBe('div');
    expect(tokens[1].type).toBe('text');
    expect(tokens[1].textContent).toBe('Hello');
    expect(tokens[2].type).toBe('endTag');
    expect(tokens[2].tagName).toBe('div');
  });

  test('tokenizes attributes', () => {
    const tokens = tokenize('<a href="https://example.com" class="link">Click</a>');
    expect(tokens[0].attributes?.get('href')).toBe('https://example.com');
    expect(tokens[0].attributes?.get('class')).toBe('link');
  });

  test('tokenizes self-closing tags with slash', () => {
    const tokens = tokenize('<img src="test.png" />');
    expect(tokens).toHaveLength(1);
    expect(tokens[0].type).toBe('selfClosingTag');
    expect(tokens[0].tagName).toBe('img');
  });

  test('tokenizes void elements without slash', () => {
    const tokens = tokenize('<br><hr>');
    expect(tokens).toHaveLength(2);
    expect(tokens[0].type).toBe('selfClosingTag');
    expect(tokens[0].tagName).toBe('br');
    expect(tokens[1].type).toBe('selfClosingTag');
    expect(tokens[1].tagName).toBe('hr');
  });

  test('tokenizes comments', () => {
    const tokens = tokenize('<!-- This is a comment --><div>Content</div>');
    expect(tokens[0].type).toBe('comment');
    expect(tokens[0].textContent).toBe(' This is a comment ');
  });

  test('handles single-quoted attributes', () => {
    const tokens = tokenize("<div class='container'>Test</div>");
    expect(tokens[0].attributes?.get('class')).toBe('container');
  });

  test('handles unquoted attributes', () => {
    const tokens = tokenize('<input type=text>');
    expect(tokens[0].attributes?.get('type')).toBe('text');
  });
});

describe('HTML Parser', () => {
  test('parses simple element', () => {
    const dom = parseHTML('<div>Hello</div>');
    expect(dom.tagName).toBe('div');
    expect(dom.children[0].textContent).toBe('Hello');
  });

  test('parses nested elements', () => {
    const dom = parseHTML('<div><p>Text</p></div>');
    expect(dom.tagName).toBe('div');
    expect(dom.children[0].tagName).toBe('p');
    expect(dom.children[0].children[0].textContent).toBe('Text');
  });

  test('parses attributes', () => {
    const dom = parseHTML('<a href="https://example.com" class="link">Click</a>');
    expect(dom.attributes.get('href')).toBe('https://example.com');
    expect(dom.attributes.get('class')).toBe('link');
  });

  test('handles self-closing tags', () => {
    const dom = parseHTML('<div><img src="test.png" /><p>After</p></div>');
    expect(dom.children).toHaveLength(2);
    expect(dom.children[0].tagName).toBe('img');
    expect(dom.children[0].attributes.get('src')).toBe('test.png');
    expect(dom.children[1].tagName).toBe('p');
  });

  test('handles multiple root-level text and elements', () => {
    const dom = parseHTML('<p>One</p><p>Two</p>');
    // Should wrap in a document root
    expect(dom.type).toBe('document');
    expect(dom.children).toHaveLength(2);
    expect(dom.children[0].tagName).toBe('p');
    expect(dom.children[1].tagName).toBe('p');
  });

  test('handles deeply nested elements', () => {
    const dom = parseHTML('<div><ul><li><a href="#">Link</a></li></ul></div>');
    expect(dom.tagName).toBe('div');
    expect(dom.children[0].tagName).toBe('ul');
    expect(dom.children[0].children[0].tagName).toBe('li');
    expect(dom.children[0].children[0].children[0].tagName).toBe('a');
    expect(dom.children[0].children[0].children[0].children[0].textContent).toBe('Link');
  });

  test('handles void elements without closing slash', () => {
    const dom = parseHTML('<div><br><hr><input type="text"></div>');
    expect(dom.children).toHaveLength(3);
    expect(dom.children[0].tagName).toBe('br');
    expect(dom.children[1].tagName).toBe('hr');
    expect(dom.children[2].tagName).toBe('input');
  });

  test('supports basic tags: div, span, p, h1-h6, a, img, ul, ol, li, strong, em', () => {
    const html = `
      <div>
        <h1>Title</h1>
        <p><strong>Bold</strong> and <em>italic</em></p>
        <span>Inline</span>
        <a href="#">Link</a>
        <img src="img.png" />
        <ul><li>Item 1</li></ul>
        <ol><li>Item 2</li></ol>
      </div>
    `;
    const dom = parseHTML(html);
    expect(dom.tagName).toBe('div');
    
    // Find all tag names in the tree
    const tagNames = new Set<string>();
    function collectTags(node: DOMNode) {
      if (node.tagName) tagNames.add(node.tagName);
      node.children.forEach(collectTags);
    }
    collectTags(dom);
    
    expect(tagNames.has('div')).toBe(true);
    expect(tagNames.has('h1')).toBe(true);
    expect(tagNames.has('p')).toBe(true);
    expect(tagNames.has('strong')).toBe(true);
    expect(tagNames.has('em')).toBe(true);
    expect(tagNames.has('span')).toBe(true);
    expect(tagNames.has('a')).toBe(true);
    expect(tagNames.has('img')).toBe(true);
    expect(tagNames.has('ul')).toBe(true);
    expect(tagNames.has('ol')).toBe(true);
    expect(tagNames.has('li')).toBe(true);
  });

  test('handles mixed content (text and elements)', () => {
    const dom = parseHTML('<p>Hello <strong>world</strong>!</p>');
    expect(dom.tagName).toBe('p');
    expect(dom.children).toHaveLength(3);
    expect(dom.children[0].textContent).toBe('Hello ');
    expect(dom.children[1].tagName).toBe('strong');
    expect(dom.children[2].textContent).toBe('!');
  });

  test('handles empty elements', () => {
    const dom = parseHTML('<div></div>');
    expect(dom.tagName).toBe('div');
    expect(dom.children).toHaveLength(0);
  });

  test('preserves whitespace in text content', () => {
    const dom = parseHTML('<pre>  indented  </pre>');
    expect(dom.children[0].textContent).toBe('  indented  ');
  });

  test('handles malformed HTML gracefully (unclosed tags)', () => {
    // Lenient parsing - should not throw
    const dom = parseHTML('<div><p>Unclosed paragraph<span>Also unclosed</div>');
    expect(dom.tagName).toBe('div');
    expect(dom.children.length).toBeGreaterThan(0);
  });

  test('handles extra closing tags gracefully', () => {
    // Should not throw on extra closing tags
    const dom = parseHTML('<div>Content</div></div></div>');
    expect(dom.tagName).toBe('div');
    expect(dom.children[0].textContent).toBe('Content');
  });

  test('normalizes tag names to lowercase', () => {
    const dom = parseHTML('<DIV><SPAN>Test</SPAN></DIV>');
    expect(dom.tagName).toBe('div');
    expect(dom.children[0].tagName).toBe('span');
  });
});
