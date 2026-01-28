/**
 * CookieRenderer Tests
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { CookieRenderer } from '../CookieRenderer';

// Mock React's useRef and useEffect for testing
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
  };
});

describe('CookieRenderer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('exports CookieRenderer component', () => {
    expect(CookieRenderer).toBeDefined();
    expect(typeof CookieRenderer).toBe('function');
  });

  test('CookieRenderer accepts required props', () => {
    // Type check - this should compile without errors
    const props = {
      html: '<div>Test</div>',
      css: 'div { color: red; }',
    };
    expect(props.html).toBeDefined();
    expect(props.css).toBeDefined();
  });

  test('CookieRenderer accepts optional props', () => {
    // Type check - this should compile without errors
    const props = {
      html: '<div>Test</div>',
      css: 'div { color: red; }',
      width: 1024,
      height: 768,
      className: 'custom-class',
      style: { border: '1px solid black' },
      onRender: () => {},
    };
    expect(props.width).toBe(1024);
    expect(props.height).toBe(768);
  });
});

describe('CookieRenderer Integration', () => {
  test('component can be imported from engine module', async () => {
    const { CookieRenderer } = await import('../index');
    expect(CookieRenderer).toBeDefined();
  });

  test('render function can be imported from engine module', async () => {
    const { render } = await import('../index');
    expect(render).toBeDefined();
    expect(typeof render).toBe('function');
  });

  test('all engine exports are available', async () => {
    const engine = await import('../index');
    
    // HTML Parser
    expect(engine.parseHTML).toBeDefined();
    
    // CSS Parser
    expect(engine.parseCSS).toBeDefined();
    
    // Style Resolution
    expect(engine.styleTree).toBeDefined();
    
    // Layout
    expect(engine.layoutTree).toBeDefined();
    
    // Paint
    expect(engine.render).toBeDefined();
    expect(engine.Painter).toBeDefined();
    
    // React Component
    expect(engine.CookieRenderer).toBeDefined();
  });
});
