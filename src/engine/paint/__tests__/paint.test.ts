/**
 * Tests for Painting
 * Cookie Browser's custom rendering engine
 * 
 * Note: These tests use mocked canvas
 */

import { describe, test, expect, vi } from 'vitest';
import { render } from '../index';
import { Painter } from '../canvas';

// Create a mock canvas with a persistent context
function createMockCanvas() {
  const mockCtx = {
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    fillText: vi.fn(),
    drawImage: vi.fn(),
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    font: '',
  };

  const canvas = {
    width: 800,
    height: 600,
    getContext: vi.fn(() => mockCtx),
  } as unknown as HTMLCanvasElement;
  
  return { canvas, mockCtx };
}

describe('Painter', () => {
  test('creates painter from canvas', () => {
    const { canvas } = createMockCanvas();
    const painter = new Painter(canvas);
    expect(painter).toBeDefined();
  });

  test('clears canvas', () => {
    const { canvas, mockCtx } = createMockCanvas();
    const painter = new Painter(canvas);
    painter.clear();
    expect(mockCtx.clearRect).toHaveBeenCalledWith(0, 0, 800, 600);
  });

  test('fills rectangle', () => {
    const { canvas, mockCtx } = createMockCanvas();
    const painter = new Painter(canvas);
    painter.fillRect(10, 20, 100, 50, 'red');
    expect(mockCtx.fillRect).toHaveBeenCalledWith(10, 20, 100, 50);
  });

  test('draws text', () => {
    const { canvas, mockCtx } = createMockCanvas();
    const painter = new Painter(canvas);
    painter.fillText('Hello', 10, 20, 'black', '16px Arial');
    expect(mockCtx.fillText).toHaveBeenCalledWith('Hello', 10, 20);
  });
});

describe('Render', () => {
  test('renders without throwing', () => {
    const { canvas } = createMockCanvas();
    const html = '<div>Hello World</div>';
    const css = 'div { color: black; }';
    expect(() => render(html, css, canvas)).not.toThrow();
  });

  test('clears canvas before rendering', () => {
    const { canvas, mockCtx } = createMockCanvas();
    render('<div>Test</div>', '', canvas);
    expect(mockCtx.clearRect).toHaveBeenCalled();
  });

  test('renders background color', () => {
    const { canvas, mockCtx } = createMockCanvas();
    render('<div>Content</div>', 'div { background: red; }', canvas);
    expect(mockCtx.fillRect).toHaveBeenCalled();
  });

  test('handles empty HTML', () => {
    const { canvas } = createMockCanvas();
    expect(() => render('', '', canvas)).not.toThrow();
  });

  test('handles complex nested HTML', () => {
    const { canvas } = createMockCanvas();
    const html = `
      <div>
        <h1>Title</h1>
        <p>Paragraph with <strong>bold</strong> text</p>
        <ul>
          <li>Item 1</li>
          <li>Item 2</li>
        </ul>
      </div>
    `;
    const css = `
      div { padding: 20px; }
      h1 { color: navy; }
      p { margin: 10px 0; }
    `;
    expect(() => render(html, css, canvas)).not.toThrow();
  });

  test('renders text nodes', () => {
    const { canvas, mockCtx } = createMockCanvas();
    render('<p>Hello World</p>', 'p { color: blue; }', canvas);
    // Text is rendered via fillText
    expect(mockCtx.fillText).toHaveBeenCalled();
  });
});
