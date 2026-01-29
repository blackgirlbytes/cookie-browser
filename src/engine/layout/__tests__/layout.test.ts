/**
 * Tests for Layout Engine
 * Cookie Browser's custom rendering engine
 */

import { describe, test, expect } from 'vitest';
import { parseHTML } from '../../html';
import { parseCSS } from '../../css';
import { styleTree } from '../../style';
import { layoutTree, marginBox } from '../index';

describe('Layout Engine', () => {
  test('calculates box model', () => {
    const dom = parseHTML('<div>Hello</div>');
    const css = parseCSS('div { width: 100px; padding: 10px; margin: 5px; }');
    const styled = styleTree(dom, css);
    const layout = layoutTree(styled, 800, 600);
    
    expect(layout.box.content.width).toBe(100);
    expect(layout.box.padding.left).toBe(10);
    expect(layout.box.padding.right).toBe(10);
    expect(layout.box.margin.left).toBe(5);
    expect(layout.box.margin.right).toBe(5);
  });

  test('block elements stack vertically', () => {
    const dom = parseHTML('<div><p>One</p><p>Two</p></div>');
    const css = parseCSS('p { height: 20px; display: block; }');
    const styled = styleTree(dom, css);
    const layout = layoutTree(styled, 800, 600);
    
    expect(layout.children.length).toBeGreaterThanOrEqual(2);
    
    const p1 = layout.children[0];
    const p2 = layout.children[1];
    expect(p2.box.content.y).toBeGreaterThan(p1.box.content.y);
  });

  test('percentage width relative to parent', () => {
    const dom = parseHTML('<div><span>Hello</span></div>');
    const css = parseCSS('div { width: 200px; } span { width: 50%; display: inline-block; }');
    const styled = styleTree(dom, css);
    const layout = layoutTree(styled, 800, 600);
    
    expect(layout.box.content.width).toBe(200);
    expect(layout.children[0].box.content.width).toBe(100);
  });

  test('auto width fills container', () => {
    const dom = parseHTML('<div>Content</div>');
    const css = parseCSS('div { display: block; }');
    const styled = styleTree(dom, css);
    const layout = layoutTree(styled, 800, 600);
    
    // Should fill the viewport width
    expect(layout.box.content.width).toBe(800);
  });

  test('margin box includes all edges', () => {
    const dom = parseHTML('<div>Hello</div>');
    const css = parseCSS('div { width: 100px; height: 50px; padding: 10px; margin: 5px; }');
    const styled = styleTree(dom, css);
    const layout = layoutTree(styled, 800, 600);
    
    const mBox = marginBox(layout.box);
    
    // margin box width = content + padding*2 + margin*2
    expect(mBox.width).toBe(100 + 20 + 10); // 130
    expect(mBox.height).toBe(50 + 20 + 10); // 80
  });

  test('nested elements are positioned correctly', () => {
    const dom = parseHTML('<div><p>Nested</p></div>');
    const css = parseCSS('div { padding: 20px; } p { display: block; }');
    const styled = styleTree(dom, css);
    const layout = layoutTree(styled, 800, 600);
    
    // Child should be offset by parent's padding
    const child = layout.children[0];
    expect(child.box.content.x).toBeGreaterThanOrEqual(20);
  });

  test('handles fixed height', () => {
    const dom = parseHTML('<div>Content</div>');
    const css = parseCSS('div { height: 100px; }');
    const styled = styleTree(dom, css);
    const layout = layoutTree(styled, 800, 600);
    
    expect(layout.box.content.height).toBe(100);
  });

  test('handles em units', () => {
    const dom = parseHTML('<div>Content</div>');
    const css = parseCSS('div { width: 10em; font-size: 16px; }');
    const styled = styleTree(dom, css);
    const layout = layoutTree(styled, 800, 600);
    
    expect(layout.box.content.width).toBe(160); // 10 * 16
  });

  test('handles shorthand margin', () => {
    const dom = parseHTML('<div>Content</div>');
    const css = parseCSS('div { margin: 10px 20px; }');
    const styled = styleTree(dom, css);
    const layout = layoutTree(styled, 800, 600);
    
    expect(layout.box.margin.top).toBe(10);
    expect(layout.box.margin.bottom).toBe(10);
    expect(layout.box.margin.left).toBe(20);
    expect(layout.box.margin.right).toBe(20);
  });

  test('handles shorthand padding with 4 values', () => {
    const dom = parseHTML('<div>Content</div>');
    const css = parseCSS('div { padding: 1px 2px 3px 4px; }');
    const styled = styleTree(dom, css);
    const layout = layoutTree(styled, 800, 600);
    
    expect(layout.box.padding.top).toBe(1);
    expect(layout.box.padding.right).toBe(2);
    expect(layout.box.padding.bottom).toBe(3);
    expect(layout.box.padding.left).toBe(4);
  });

  test('display none elements have zero size', () => {
    const dom = parseHTML('<div>Hidden</div>');
    const css = parseCSS('div { display: none; }');
    const styled = styleTree(dom, css);
    const layout = layoutTree(styled, 800, 600);
    
    expect(layout.box.content.width).toBe(0);
    expect(layout.box.content.height).toBe(0);
    expect(layout.displayType).toBe('none');
  });
});
