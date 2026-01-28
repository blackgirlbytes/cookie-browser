/**
 * Layout Engine Tests
 */

import { describe, test, expect } from 'vitest';
import { parseHTML } from '../../html';
import { parseCSS } from '../../css';
import { styleTree } from '../../style';
import { layoutTree, parseLength, parseEdges, marginBox } from '../index';

describe('Box Model Parsing', () => {
  test('parses pixel values', () => {
    expect(parseLength('10px')).toBe(10);
    expect(parseLength('100px')).toBe(100);
  });

  test('parses em values', () => {
    expect(parseLength('1em')).toBe(16);
    expect(parseLength('2em')).toBe(32);
  });

  test('parses percentage values', () => {
    expect(parseLength('50%', 200)).toBe(100);
    expect(parseLength('25%', 400)).toBe(100);
  });

  test('handles auto and none', () => {
    expect(parseLength('auto')).toBe(0);
    expect(parseLength('none')).toBe(0);
  });

  test('parses edge shorthand - single value', () => {
    const edges = parseEdges('10px');
    expect(edges.top).toBe(10);
    expect(edges.right).toBe(10);
    expect(edges.bottom).toBe(10);
    expect(edges.left).toBe(10);
  });

  test('parses edge shorthand - two values', () => {
    const edges = parseEdges('10px 20px');
    expect(edges.top).toBe(10);
    expect(edges.right).toBe(20);
    expect(edges.bottom).toBe(10);
    expect(edges.left).toBe(20);
  });

  test('parses edge shorthand - four values', () => {
    const edges = parseEdges('1px 2px 3px 4px');
    expect(edges.top).toBe(1);
    expect(edges.right).toBe(2);
    expect(edges.bottom).toBe(3);
    expect(edges.left).toBe(4);
  });
});

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
    const dom = parseHTML('<div><p>Hello</p></div>');
    const css = parseCSS('div { width: 200px; } p { width: 50%; display: block; }');
    const styled = styleTree(dom, css);
    const layout = layoutTree(styled, 800, 600);
    
    expect(layout.box.content.width).toBe(200);
    expect(layout.children[0].box.content.width).toBe(100);
  });

  test('auto width fills container', () => {
    const dom = parseHTML('<div><p>Hello</p></div>');
    const css = parseCSS('div { width: 400px; } p { display: block; }');
    const styled = styleTree(dom, css);
    const layout = layoutTree(styled, 800, 600);
    
    // p should fill the div's width
    expect(layout.children[0].box.content.width).toBe(400);
  });

  test('padding affects content position', () => {
    const dom = parseHTML('<div><p>Hello</p></div>');
    const css = parseCSS('div { padding: 20px; width: 200px; } p { display: block; }');
    const styled = styleTree(dom, css);
    const layout = layoutTree(styled, 800, 600);
    
    // Child should be offset by parent's padding
    expect(layout.children[0].box.content.x).toBe(20);
  });

  test('nested elements layout correctly', () => {
    const dom = parseHTML('<div><section><p>Text</p></section></div>');
    const css = parseCSS(`
      div { width: 300px; padding: 10px; }
      section { width: 200px; padding: 5px; display: block; }
      p { display: block; }
    `);
    const styled = styleTree(dom, css);
    const layout = layoutTree(styled, 800, 600);
    
    expect(layout.box.content.width).toBe(300);
    expect(layout.children[0].box.content.width).toBe(200);
  });

  test('margin box calculation', () => {
    const dom = parseHTML('<div>Hello</div>');
    const css = parseCSS('div { width: 100px; height: 50px; margin: 10px; padding: 5px; }');
    const styled = styleTree(dom, css);
    const layout = layoutTree(styled, 800, 600);
    
    const mBox = marginBox(layout.box);
    // margin box width = content + padding*2 + margin*2
    expect(mBox.width).toBe(100 + 5*2 + 10*2); // 130
    expect(mBox.height).toBe(50 + 5*2 + 10*2); // 80
  });

  test('explicit height is respected', () => {
    const dom = parseHTML('<div>Hello</div>');
    const css = parseCSS('div { height: 150px; }');
    const styled = styleTree(dom, css);
    const layout = layoutTree(styled, 800, 600);
    
    expect(layout.box.content.height).toBe(150);
  });

  test('viewport width is used for root', () => {
    const dom = parseHTML('<div>Hello</div>');
    const css = parseCSS('div { display: block; }');
    const styled = styleTree(dom, css);
    const layout = layoutTree(styled, 1024, 768);
    
    // Root block should fill viewport width
    expect(layout.box.content.width).toBe(1024);
  });
});
