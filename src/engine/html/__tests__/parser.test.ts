/**
 * HTML Parser Tests
 */

import { describe, test, expect } from 'vitest';
import { parseHTML, tokenize, getTextContent, getElementsByTagName, getElementById, getElementsByClassName } from '../index';

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

  test('handles boolean attributes', () => {
    const tokens = tokenize('<input disabled>');
    expect(tokens[0].attributes?.has('disabled')).toBe(true);
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
  });

  test('handles void elements without explicit close', () => {
    const dom = parseHTML('<div><br><hr><p>Text</p></div>');
    expect(dom.children).toHaveLength(3);
    expect(dom.children[0].tagName).toBe('br');
    expect(dom.children[1].tagName).toBe('hr');
    expect(dom.children[2].tagName).toBe('p');
  });

  test('preserves text content', () => {
    const dom = parseHTML('<p>Hello <strong>World</strong>!</p>');
    expect(dom.children).toHaveLength(3);
    expect(dom.children[0].textContent).toBe('Hello ');
    expect(dom.children[1].tagName).toBe('strong');
    expect(dom.children[2].textContent).toBe('!');
  });

  test('handles all basic tags', () => {
    const basicTags = ['div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
                       'a', 'img', 'ul', 'ol', 'li', 'strong', 'em'];
    
    for (const tag of basicTags) {
      if (tag === 'img') {
        const dom = parseHTML(`<${tag} src="test.png" />`);
        expect(dom.tagName).toBe(tag);
      } else {
        const dom = parseHTML(`<${tag}>Content</${tag}>`);
        expect(dom.tagName).toBe(tag);
      }
    }
  });

  test('handles case-insensitive tag names', () => {
    const dom = parseHTML('<DIV><P>Test</P></DIV>');
    expect(dom.tagName).toBe('div');
    expect(dom.children[0].tagName).toBe('p');
  });
});

describe('DOM Utilities', () => {
  test('getTextContent returns all text', () => {
    const dom = parseHTML('<div>Hello <span>World</span>!</div>');
    expect(getTextContent(dom)).toBe('Hello World!');
  });

  test('getElementsByTagName finds all matching elements', () => {
    const dom = parseHTML('<div><p>One</p><p>Two</p><span><p>Three</p></span></div>');
    const paragraphs = getElementsByTagName(dom, 'p');
    expect(paragraphs).toHaveLength(3);
  });

  test('getElementById finds element by id', () => {
    const dom = parseHTML('<div><p id="main">Main</p><p id="other">Other</p></div>');
    const main = getElementById(dom, 'main');
    expect(main).not.toBeNull();
    expect(main?.tagName).toBe('p');
    expect(getTextContent(main!)).toBe('Main');
  });

  test('getElementsByClassName finds elements by class', () => {
    const dom = parseHTML('<div><p class="highlight">One</p><p class="highlight special">Two</p><p>Three</p></div>');
    const highlighted = getElementsByClassName(dom, 'highlight');
    expect(highlighted).toHaveLength(2);
  });
});
