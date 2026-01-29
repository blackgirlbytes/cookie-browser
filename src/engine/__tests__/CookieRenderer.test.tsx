/**
 * Tests for CookieRenderer React component
 * Cookie Browser's custom rendering engine
 */

import { describe, test, expect, vi } from 'vitest';
import React from 'react';

// Mock the render function since we don't have a real canvas in tests
vi.mock('../paint', () => ({
  render: vi.fn(),
}));

import { CookieRenderer } from '../CookieRenderer';

describe('CookieRenderer', () => {
  test('exports CookieRenderer component', () => {
    expect(CookieRenderer).toBeDefined();
    expect(typeof CookieRenderer).toBe('function');
  });

  test('component has correct display name', () => {
    // React.FC components have a name
    expect(CookieRenderer.name).toBeDefined();
  });

  test('accepts required props', () => {
    // Type check - this would fail at compile time if props are wrong
    const props = {
      html: '<div>Test</div>',
    };
    
    // Create element to verify props are accepted
    const element = React.createElement(CookieRenderer, props);
    expect(element).toBeDefined();
    expect(element.props.html).toBe('<div>Test</div>');
  });

  test('accepts optional props', () => {
    const props = {
      html: '<div>Test</div>',
      css: 'div { color: red; }',
      width: 1024,
      height: 768,
      className: 'custom-class',
    };
    
    const element = React.createElement(CookieRenderer, props);
    expect(element.props.css).toBe('div { color: red; }');
    expect(element.props.width).toBe(1024);
    expect(element.props.height).toBe(768);
    expect(element.props.className).toBe('custom-class');
  });
});
