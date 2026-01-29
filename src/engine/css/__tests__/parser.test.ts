/**
 * Tests for CSS Parser
 * Cookie Browser's custom rendering engine
 */

import { describe, test, expect } from 'vitest';
import { parseCSS } from '../index';
import { tokenizeCSS } from '../tokenizer';

describe('CSS Tokenizer', () => {
  test('tokenizes simple rule', () => {
    const tokens = tokenizeCSS('div { color: red; }');
    expect(tokens.some(t => t.type === 'selector' && t.value === 'div')).toBe(true);
    expect(tokens.some(t => t.type === 'property' && t.value === 'color')).toBe(true);
    expect(tokens.some(t => t.type === 'value' && t.value === 'red')).toBe(true);
  });

  test('tokenizes multiple declarations', () => {
    const tokens = tokenizeCSS('div { color: red; margin: 10px; }');
    const properties = tokens.filter(t => t.type === 'property');
    expect(properties).toHaveLength(2);
    expect(properties[0].value).toBe('color');
    expect(properties[1].value).toBe('margin');
  });

  test('handles comments', () => {
    const tokens = tokenizeCSS('/* comment */ div { color: red; }');
    expect(tokens.some(t => t.type === 'comment')).toBe(true);
  });

  test('handles class selectors', () => {
    const tokens = tokenizeCSS('.container { width: 100%; }');
    expect(tokens.some(t => t.type === 'selector' && t.value === '.container')).toBe(true);
  });

  test('handles ID selectors', () => {
    const tokens = tokenizeCSS('#header { height: 60px; }');
    expect(tokens.some(t => t.type === 'selector' && t.value === '#header')).toBe(true);
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

  test('parses universal selector', () => {
    const stylesheet = parseCSS('* { margin: 0; }');
    expect(stylesheet.rules[0].selectors[0].type).toBe('universal');
    expect(stylesheet.rules[0].selectors[0].value).toBe('*');
  });

  test('parses comma-separated selectors', () => {
    const stylesheet = parseCSS('h1, h2, h3 { font-weight: bold; }');
    expect(stylesheet.rules[0].selectors).toHaveLength(3);
    expect(stylesheet.rules[0].selectors[0].value).toBe('h1');
    expect(stylesheet.rules[0].selectors[1].value).toBe('h2');
    expect(stylesheet.rules[0].selectors[2].value).toBe('h3');
  });

  test('parses complex values', () => {
    const stylesheet = parseCSS('div { font-family: Arial, sans-serif; border: 1px solid black; }');
    expect(stylesheet.rules[0].declarations[0].value).toBe('Arial, sans-serif');
    expect(stylesheet.rules[0].declarations[1].value).toBe('1px solid black');
  });

  test('handles empty rules', () => {
    const stylesheet = parseCSS('div { }');
    expect(stylesheet.rules[0].declarations).toHaveLength(0);
  });

  test('normalizes tag selectors to lowercase', () => {
    const stylesheet = parseCSS('DIV { color: red; }');
    expect(stylesheet.rules[0].selectors[0].value).toBe('div');
  });

  test('parses supported properties', () => {
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
        font-family: Arial;
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
});
