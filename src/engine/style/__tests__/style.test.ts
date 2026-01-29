/**
 * Tests for Style Resolution
 * Cookie Browser's custom rendering engine
 */

import { describe, test, expect } from 'vitest';
import { parseHTML } from '../../html';
import { parseCSS } from '../../css';
import { styleTree, calculateSpecificity, compareSpecificity } from '../index';

describe('Specificity', () => {
  test('ID selector has highest specificity', () => {
    const idSpec = calculateSpecificity({ type: 'id', value: 'header' });
    const classSpec = calculateSpecificity({ type: 'class', value: 'container' });
    const tagSpec = calculateSpecificity({ type: 'tag', value: 'div' });

    expect(compareSpecificity(idSpec, classSpec)).toBeGreaterThan(0);
    expect(compareSpecificity(classSpec, tagSpec)).toBeGreaterThan(0);
    expect(compareSpecificity(idSpec, tagSpec)).toBeGreaterThan(0);
  });

  test('class beats tag selector', () => {
    const classSpec = calculateSpecificity({ type: 'class', value: 'highlight' });
    const tagSpec = calculateSpecificity({ type: 'tag', value: 'div' });

    expect(compareSpecificity(classSpec, tagSpec)).toBeGreaterThan(0);
  });

  test('universal selector has zero specificity', () => {
    const universalSpec = calculateSpecificity({ type: 'universal', value: '*' });
    expect(universalSpec.a).toBe(0);
    expect(universalSpec.b).toBe(0);
    expect(universalSpec.c).toBe(0);
  });
});

describe('Style Resolution', () => {
  test('matches tag selector', () => {
    const dom = parseHTML('<div>Hello</div>');
    const css = parseCSS('div { color: red; }');
    const styled = styleTree(dom, css);
    expect(styled.styles.get('color')).toBe('red');
  });

  test('matches class selector', () => {
    const dom = parseHTML('<div class="highlight">Hello</div>');
    const css = parseCSS('.highlight { color: yellow; }');
    const styled = styleTree(dom, css);
    expect(styled.styles.get('color')).toBe('yellow');
  });

  test('matches ID selector', () => {
    const dom = parseHTML('<div id="main">Hello</div>');
    const css = parseCSS('#main { color: green; }');
    const styled = styleTree(dom, css);
    expect(styled.styles.get('color')).toBe('green');
  });

  test('higher specificity wins', () => {
    const dom = parseHTML('<div class="highlight">Hello</div>');
    const css = parseCSS('div { color: red; } .highlight { color: yellow; }');
    const styled = styleTree(dom, css);
    expect(styled.styles.get('color')).toBe('yellow'); // class beats tag
  });

  test('ID beats class', () => {
    const dom = parseHTML('<div id="main" class="highlight">Hello</div>');
    const css = parseCSS('.highlight { color: yellow; } #main { color: green; }');
    const styled = styleTree(dom, css);
    expect(styled.styles.get('color')).toBe('green'); // ID beats class
  });

  test('inherits color to children', () => {
    const dom = parseHTML('<div><span>Hello</span></div>');
    const css = parseCSS('div { color: blue; }');
    const styled = styleTree(dom, css);
    expect(styled.children[0].styles.get('color')).toBe('blue');
  });

  test('inherits font-family to children', () => {
    const dom = parseHTML('<div><span>Hello</span></div>');
    const css = parseCSS('div { font-family: Arial; }');
    const styled = styleTree(dom, css);
    expect(styled.children[0].styles.get('font-family')).toBe('Arial');
  });

  test('does not inherit margin', () => {
    const dom = parseHTML('<div><span>Hello</span></div>');
    const css = parseCSS('div { margin: 10px; }');
    const styled = styleTree(dom, css);
    expect(styled.styles.get('margin')).toBe('10px');
    expect(styled.children[0].styles.get('margin')).toBeUndefined();
  });

  test('does not inherit padding', () => {
    const dom = parseHTML('<div><span>Hello</span></div>');
    const css = parseCSS('div { padding: 5px; }');
    const styled = styleTree(dom, css);
    expect(styled.styles.get('padding')).toBe('5px');
    expect(styled.children[0].styles.get('padding')).toBeUndefined();
  });

  test('applies default browser styles', () => {
    const dom = parseHTML('<strong>Bold</strong>');
    const css = parseCSS('');
    const styled = styleTree(dom, css);
    expect(styled.styles.get('font-weight')).toBe('bold');
  });

  test('applies default display values', () => {
    const dom = parseHTML('<div><span>Inline</span></div>');
    const css = parseCSS('');
    const styled = styleTree(dom, css);
    expect(styled.styles.get('display')).toBe('block');
    expect(styled.children[0].styles.get('display')).toBe('inline');
  });

  test('child can override inherited styles', () => {
    const dom = parseHTML('<div><span>Hello</span></div>');
    const css = parseCSS('div { color: blue; } span { color: red; }');
    const styled = styleTree(dom, css);
    expect(styled.styles.get('color')).toBe('blue');
    expect(styled.children[0].styles.get('color')).toBe('red');
  });

  test('handles multiple classes', () => {
    const dom = parseHTML('<div class="one two three">Hello</div>');
    const css = parseCSS('.two { color: green; }');
    const styled = styleTree(dom, css);
    expect(styled.styles.get('color')).toBe('green');
  });

  test('later rules win with equal specificity', () => {
    const dom = parseHTML('<div>Hello</div>');
    const css = parseCSS('div { color: red; } div { color: blue; }');
    const styled = styleTree(dom, css);
    expect(styled.styles.get('color')).toBe('blue');
  });

  test('handles deeply nested elements', () => {
    const dom = parseHTML('<div><p><span>Deep</span></p></div>');
    const css = parseCSS('div { color: red; }');
    const styled = styleTree(dom, css);
    
    // Color should inherit all the way down
    expect(styled.styles.get('color')).toBe('red');
    expect(styled.children[0].styles.get('color')).toBe('red');
    expect(styled.children[0].children[0].styles.get('color')).toBe('red');
  });

  test('handles inline styles', () => {
    const dom = parseHTML('<div style="color: purple;">Hello</div>');
    const css = parseCSS('div { color: red; }');
    const styled = styleTree(dom, css);
    expect(styled.styles.get('color')).toBe('purple'); // inline beats everything
  });
});
