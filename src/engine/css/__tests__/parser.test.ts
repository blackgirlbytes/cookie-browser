/**
 * CSS Parser Tests
 */

import { describe, test, expect } from 'vitest';
import { parseCSS, tokenizeCSS } from '../index';

describe('CSS Tokenizer', () => {
  test('tokenizes simple rule', () => {
    const tokens = tokenizeCSS('div { color: red; }');
    expect(tokens.some(t => t.type === 'selector' && t.value === 'div')).toBe(true);
    expect(tokens.some(t => t.type === 'property' && t.value === 'color')).toBe(true);
    expect(tokens.some(t => t.type === 'value' && t.value === 'red')).toBe(true);
  });

  test('tokenizes class selector', () => {
    const tokens = tokenizeCSS('.container { width: 100%; }');
    expect(tokens.some(t => t.type === 'selector' && t.value === '.container')).toBe(true);
  });

  test('tokenizes id selector', () => {
    const tokens = tokenizeCSS('#header { height: 60px; }');
    expect(tokens.some(t => t.type === 'selector' && t.value === '#header')).toBe(true);
  });

  test('tokenizes multiple declarations', () => {
    const tokens = tokenizeCSS('div { color: red; margin: 10px; }');
    const properties = tokens.filter(t => t.type === 'property');
    expect(properties).toHaveLength(2);
  });

  test('handles comments', () => {
    const tokens = tokenizeCSS('/* comment */ div { color: red; }');
    expect(tokens.some(t => t.type === 'comment')).toBe(true);
    expect(tokens.some(t => t.type === 'selector' && t.value === 'div')).toBe(true);
  });
});

describe('CSS Parser', () => {
  test('parses tag selector', () => {
    const stylesheet = parseCSS('div { color: red; }');
    expect(stylesheet.rules[0].selectors[0].type).toBe('tag');
    expect(stylesheet.rules[0].selectors[0].value).toBe('div');
  });

  test('parses class selector', () => {
    const stylesheet = parseCSS('.container { width: 100%; }');
    expect(stylesheet.rules[0].selectors[0].type).toBe('class');
    expect(stylesheet.rules[0].selectors[0].value).toBe('container');
  });

  test('parses ID selector', () => {
    const stylesheet = parseCSS('#header { height: 60px; }');
    expect(stylesheet.rules[0].selectors[0].type).toBe('id');
    expect(stylesheet.rules[0].selectors[0].value).toBe('header');
  });

  test('parses multiple declarations', () => {
    const stylesheet = parseCSS('div { color: red; margin: 10px; padding: 5px; }');
    expect(stylesheet.rules[0].declarations).toHaveLength(3);
    expect(stylesheet.rules[0].declarations[0].property).toBe('color');
    expect(stylesheet.rules[0].declarations[0].value).toBe('red');
    expect(stylesheet.rules[0].declarations[1].property).toBe('margin');
    expect(stylesheet.rules[0].declarations[1].value).toBe('10px');
    expect(stylesheet.rules[0].declarations[2].property).toBe('padding');
    expect(stylesheet.rules[0].declarations[2].value).toBe('5px');
  });

  test('parses multiple rules', () => {
    const stylesheet = parseCSS('div { color: red; } p { color: blue; }');
    expect(stylesheet.rules).toHaveLength(2);
    expect(stylesheet.rules[0].selectors[0].value).toBe('div');
    expect(stylesheet.rules[1].selectors[0].value).toBe('p');
  });

  test('parses comma-separated selectors', () => {
    const stylesheet = parseCSS('h1, h2, h3 { font-weight: bold; }');
    expect(stylesheet.rules[0].selectors).toHaveLength(3);
    expect(stylesheet.rules[0].selectors[0].value).toBe('h1');
    expect(stylesheet.rules[0].selectors[1].value).toBe('h2');
    expect(stylesheet.rules[0].selectors[2].value).toBe('h3');
  });

  test('parses compound selectors', () => {
    const stylesheet = parseCSS('div.container { width: 100%; }');
    expect(stylesheet.rules[0].selectors[0].type).toBe('compound');
    expect(stylesheet.rules[0].selectors[0].parts).toHaveLength(2);
    expect(stylesheet.rules[0].selectors[0].parts![0].type).toBe('tag');
    expect(stylesheet.rules[0].selectors[0].parts![0].value).toBe('div');
    expect(stylesheet.rules[0].selectors[0].parts![1].type).toBe('class');
    expect(stylesheet.rules[0].selectors[0].parts![1].value).toBe('container');
  });

  test('parses universal selector', () => {
    const stylesheet = parseCSS('* { margin: 0; }');
    expect(stylesheet.rules[0].selectors[0].type).toBe('universal');
    expect(stylesheet.rules[0].selectors[0].value).toBe('*');
  });

  test('handles supported properties', () => {
    const css = `
      div {
        color: #333;
        background: white;
        margin: 10px;
        padding: 5px;
        border: 1px solid black;
        width: 100px;
        height: 50px;
        font-size: 16px;
        font-family: Arial, sans-serif;
        display: block;
      }
    `;
    const stylesheet = parseCSS(css);
    expect(stylesheet.rules[0].declarations).toHaveLength(10);
    
    const props = stylesheet.rules[0].declarations.map(d => d.property);
    expect(props).toContain('color');
    expect(props).toContain('background');
    expect(props).toContain('margin');
    expect(props).toContain('padding');
    expect(props).toContain('border');
    expect(props).toContain('width');
    expect(props).toContain('height');
    expect(props).toContain('font-size');
    expect(props).toContain('font-family');
    expect(props).toContain('display');
  });

  test('handles values with spaces', () => {
    const stylesheet = parseCSS('div { font-family: Arial, sans-serif; }');
    expect(stylesheet.rules[0].declarations[0].value).toBe('Arial, sans-serif');
  });

  test('handles hex colors', () => {
    const stylesheet = parseCSS('div { color: #ff0000; background: #fff; }');
    expect(stylesheet.rules[0].declarations[0].value).toBe('#ff0000');
    expect(stylesheet.rules[0].declarations[1].value).toBe('#fff');
  });

  test('handles rgb colors', () => {
    const stylesheet = parseCSS('div { color: rgb(255, 0, 0); }');
    expect(stylesheet.rules[0].declarations[0].value).toBe('rgb(255, 0, 0)');
  });

  test('ignores comments in output', () => {
    const stylesheet = parseCSS('/* header styles */ div { color: red; }');
    expect(stylesheet.rules).toHaveLength(1);
    expect(stylesheet.rules[0].selectors[0].value).toBe('div');
  });

  test('handles empty rules', () => {
    const stylesheet = parseCSS('div { }');
    expect(stylesheet.rules[0].declarations).toHaveLength(0);
  });

  test('handles missing semicolon on last declaration', () => {
    const stylesheet = parseCSS('div { color: red }');
    expect(stylesheet.rules[0].declarations).toHaveLength(1);
    expect(stylesheet.rules[0].declarations[0].value).toBe('red');
  });
});
