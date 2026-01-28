/**
 * Style Resolution Tests
 */

import { describe, test, expect } from 'vitest';
import { parseHTML } from '../../html';
import { parseCSS } from '../../css';
import { styleTree, isInheritedProperty } from '../index';
import { matches } from '../matcher';
import { calculateSpecificity, compareSpecificity } from '../specificity';

describe('Selector Matching', () => {
  test('matches tag selector', () => {
    const dom = parseHTML('<div>Hello</div>');
    const selector = { type: 'tag' as const, value: 'div' };
    expect(matches(dom, selector)).toBe(true);
  });

  test('matches class selector', () => {
    const dom = parseHTML('<div class="highlight">Hello</div>');
    const selector = { type: 'class' as const, value: 'highlight' };
    expect(matches(dom, selector)).toBe(true);
  });

  test('matches id selector', () => {
    const dom = parseHTML('<div id="main">Hello</div>');
    const selector = { type: 'id' as const, value: 'main' };
    expect(matches(dom, selector)).toBe(true);
  });

  test('matches universal selector', () => {
    const dom = parseHTML('<div>Hello</div>');
    const selector = { type: 'universal' as const, value: '*' };
    expect(matches(dom, selector)).toBe(true);
  });

  test('matches compound selector', () => {
    const dom = parseHTML('<div class="container" id="main">Hello</div>');
    const selector = {
      type: 'compound' as const,
      value: 'div.container#main',
      parts: [
        { type: 'tag' as const, value: 'div' },
        { type: 'class' as const, value: 'container' },
        { type: 'id' as const, value: 'main' }
      ]
    };
    expect(matches(dom, selector)).toBe(true);
  });

  test('does not match wrong tag', () => {
    const dom = parseHTML('<div>Hello</div>');
    const selector = { type: 'tag' as const, value: 'span' };
    expect(matches(dom, selector)).toBe(false);
  });

  test('does not match wrong class', () => {
    const dom = parseHTML('<div class="other">Hello</div>');
    const selector = { type: 'class' as const, value: 'highlight' };
    expect(matches(dom, selector)).toBe(false);
  });
});

describe('Specificity Calculation', () => {
  test('id selector has highest specificity', () => {
    const idSpec = calculateSpecificity({ type: 'id', value: 'main' });
    const classSpec = calculateSpecificity({ type: 'class', value: 'container' });
    const tagSpec = calculateSpecificity({ type: 'tag', value: 'div' });

    expect(compareSpecificity(idSpec, classSpec)).toBeGreaterThan(0);
    expect(compareSpecificity(classSpec, tagSpec)).toBeGreaterThan(0);
    expect(compareSpecificity(idSpec, tagSpec)).toBeGreaterThan(0);
  });

  test('compound selector sums specificity', () => {
    const compound = calculateSpecificity({
      type: 'compound',
      value: 'div.container',
      parts: [
        { type: 'tag', value: 'div' },
        { type: 'class', value: 'container' }
      ]
    });

    expect(compound.a).toBe(0); // No IDs
    expect(compound.b).toBe(1); // One class
    expect(compound.c).toBe(1); // One tag
  });

  test('universal selector has no specificity', () => {
    const spec = calculateSpecificity({ type: 'universal', value: '*' });
    expect(spec.a).toBe(0);
    expect(spec.b).toBe(0);
    expect(spec.c).toBe(0);
  });
});

describe('Style Resolution', () => {
  test('matches tag selector', () => {
    const dom = parseHTML('<div>Hello</div>');
    const css = parseCSS('div { color: red; }');
    const styled = styleTree(dom, css);
    expect(styled.styles.color).toBe('red');
  });

  test('matches class selector', () => {
    const dom = parseHTML('<div class="highlight">Hello</div>');
    const css = parseCSS('.highlight { color: yellow; }');
    const styled = styleTree(dom, css);
    expect(styled.styles.color).toBe('yellow');
  });

  test('matches id selector', () => {
    const dom = parseHTML('<div id="main">Hello</div>');
    const css = parseCSS('#main { color: green; }');
    const styled = styleTree(dom, css);
    expect(styled.styles.color).toBe('green');
  });

  test('higher specificity wins', () => {
    const dom = parseHTML('<div class="highlight">Hello</div>');
    const css = parseCSS('div { color: red; } .highlight { color: yellow; }');
    const styled = styleTree(dom, css);
    expect(styled.styles.color).toBe('yellow'); // class beats tag
  });

  test('id beats class', () => {
    const dom = parseHTML('<div id="main" class="highlight">Hello</div>');
    const css = parseCSS('.highlight { color: yellow; } #main { color: green; }');
    const styled = styleTree(dom, css);
    expect(styled.styles.color).toBe('green'); // id beats class
  });

  test('later rule wins with same specificity', () => {
    const dom = parseHTML('<div class="a b">Hello</div>');
    const css = parseCSS('.a { color: red; } .b { color: blue; }');
    const styled = styleTree(dom, css);
    expect(styled.styles.color).toBe('blue'); // later wins
  });

  test('inherits color to children', () => {
    const dom = parseHTML('<div><span>Hello</span></div>');
    const css = parseCSS('div { color: blue; }');
    const styled = styleTree(dom, css);
    expect(styled.styles.color).toBe('blue');
    expect(styled.children[0].styles.color).toBe('blue'); // inherited
  });

  test('does not inherit margin', () => {
    const dom = parseHTML('<div><span>Hello</span></div>');
    const css = parseCSS('div { margin: 10px; }');
    const styled = styleTree(dom, css);
    expect(styled.styles.margin).toBe('10px');
    expect(styled.children[0].styles.margin).not.toBe('10px'); // not inherited
  });

  test('does not inherit padding', () => {
    const dom = parseHTML('<div><span>Hello</span></div>');
    const css = parseCSS('div { padding: 20px; }');
    const styled = styleTree(dom, css);
    expect(styled.styles.padding).toBe('20px');
    expect(styled.children[0].styles.padding).not.toBe('20px'); // not inherited
  });

  test('child can override inherited styles', () => {
    const dom = parseHTML('<div><span>Hello</span></div>');
    const css = parseCSS('div { color: blue; } span { color: red; }');
    const styled = styleTree(dom, css);
    expect(styled.styles.color).toBe('blue');
    expect(styled.children[0].styles.color).toBe('red'); // overridden
  });

  test('applies default browser styles', () => {
    const dom = parseHTML('<p>Paragraph</p>');
    const css = parseCSS('');
    const styled = styleTree(dom, css);
    expect(styled.styles.display).toBe('block');
  });

  test('applies multiple properties', () => {
    const dom = parseHTML('<div>Hello</div>');
    const css = parseCSS('div { color: red; background: white; padding: 10px; }');
    const styled = styleTree(dom, css);
    expect(styled.styles.color).toBe('red');
    expect(styled.styles.background).toBe('white');
    expect(styled.styles.padding).toBe('10px');
  });
});

describe('Inherited Properties', () => {
  test('color is inherited', () => {
    expect(isInheritedProperty('color')).toBe(true);
  });

  test('font-family is inherited', () => {
    expect(isInheritedProperty('font-family')).toBe(true);
  });

  test('font-size is inherited', () => {
    expect(isInheritedProperty('font-size')).toBe(true);
  });

  test('margin is not inherited', () => {
    expect(isInheritedProperty('margin')).toBe(false);
  });

  test('padding is not inherited', () => {
    expect(isInheritedProperty('padding')).toBe(false);
  });

  test('border is not inherited', () => {
    expect(isInheritedProperty('border')).toBe(false);
  });
});
