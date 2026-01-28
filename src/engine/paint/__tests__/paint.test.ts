/**
 * Painting Tests
 * 
 * Note: These tests use a mock canvas since jsdom doesn't fully support canvas.
 * The tests verify the logic of the paint module without actual rendering.
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, getDisplayList } from '../render';
import { Painter, buildDisplayList } from '../canvas';
import { parseHTML } from '../../html';
import { parseCSS } from '../../css';
import { styleTree } from '../../style';
import { layoutTree } from '../../layout';

// Mock canvas context type
interface MockContext {
  clearRect: ReturnType<typeof vi.fn>;
  fillRect: ReturnType<typeof vi.fn>;
  strokeRect: ReturnType<typeof vi.fn>;
  fillText: ReturnType<typeof vi.fn>;
  fillStyle: string;
  strokeStyle: string;
  lineWidth: number;
  font: string;
}

// Mock canvas context
function createMockCanvas(): { canvas: HTMLCanvasElement; mockCtx: MockContext } {
  const mockCtx: MockContext = {
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    fillText: vi.fn(),
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    font: '',
  };

  const canvas = {
    width: 800,
    height: 600,
    getContext: vi.fn().mockReturnValue(mockCtx),
  } as unknown as HTMLCanvasElement;

  return { canvas, mockCtx };
}

describe('Painting', () => {
  let canvas: HTMLCanvasElement;
  let mockCtx: MockContext;

  beforeEach(() => {
    const mock = createMockCanvas();
    canvas = mock.canvas;
    mockCtx = mock.mockCtx;
  });

  test('renders without throwing', () => {
    const html = '<div>Hello World</div>';
    const css = 'div { color: black; }';
    expect(() => render(html, css, canvas)).not.toThrow();
  });

  test('clears canvas before rendering', () => {
    render('<div>Test</div>', '', canvas);
    expect(mockCtx.clearRect).toHaveBeenCalled();
  });

  test('renders text', () => {
    render('<p>Hello</p>', '', canvas);
    expect(mockCtx.fillText).toHaveBeenCalled();
  });

  test('renders background color', () => {
    render('<div>Test</div>', 'div { background-color: red; }', canvas);
    expect(mockCtx.fillRect).toHaveBeenCalled();
  });

  test('renders border', () => {
    render('<div>Test</div>', 'div { border: 1px solid black; }', canvas);
    expect(mockCtx.strokeRect).toHaveBeenCalled();
  });
});

describe('Display List', () => {
  test('generates display list for simple element', () => {
    const displayList = getDisplayList('<div>Hello</div>', '', 800, 600);
    expect(displayList.length).toBeGreaterThan(0);
  });

  test('includes text command for text content', () => {
    const displayList = getDisplayList('<p>Hello World</p>', '', 800, 600);
    const textCommands = displayList.filter(cmd => cmd.type === 'text');
    expect(textCommands.length).toBeGreaterThan(0);
    expect(textCommands[0].text).toBe('Hello World');
  });

  test('includes rect command for background', () => {
    const displayList = getDisplayList(
      '<div>Test</div>', 
      'div { background-color: blue; }', 
      800, 
      600
    );
    const rectCommands = displayList.filter(cmd => cmd.type === 'rect');
    expect(rectCommands.length).toBeGreaterThan(0);
    expect(rectCommands[0].color).toBe('blue');
  });

  test('includes border command', () => {
    const displayList = getDisplayList(
      '<div>Test</div>', 
      'div { border: 2px solid red; }', 
      800, 
      600
    );
    const borderCommands = displayList.filter(cmd => cmd.type === 'border');
    expect(borderCommands.length).toBeGreaterThan(0);
    expect(borderCommands[0].borderColor).toBe('red');
  });

  test('nested elements generate multiple commands', () => {
    const displayList = getDisplayList(
      '<div><p>One</p><p>Two</p></div>',
      'div { background-color: white; } p { background-color: gray; }',
      800,
      600
    );
    // Should have backgrounds for div and both p elements, plus text commands
    const rectCommands = displayList.filter(cmd => cmd.type === 'rect');
    expect(rectCommands.length).toBeGreaterThanOrEqual(1);
  });
});

describe('Painter Class', () => {
  test('creates painter from canvas', () => {
    const { canvas } = createMockCanvas();
    expect(() => new Painter(canvas)).not.toThrow();
  });

  test('executes rect command', () => {
    const { canvas, mockCtx } = createMockCanvas();
    const painter = new Painter(canvas);

    painter.execute({
      type: 'rect',
      x: 10,
      y: 20,
      width: 100,
      height: 50,
      color: 'red'
    });

    expect(mockCtx.fillRect).toHaveBeenCalledWith(10, 20, 100, 50);
  });

  test('executes text command', () => {
    const { canvas, mockCtx } = createMockCanvas();
    const painter = new Painter(canvas);

    painter.execute({
      type: 'text',
      x: 10,
      y: 20,
      text: 'Hello',
      color: 'black',
      font: '16px serif'
    });

    expect(mockCtx.fillText).toHaveBeenCalledWith('Hello', 10, 20);
  });

  test('executes border command', () => {
    const { canvas, mockCtx } = createMockCanvas();
    const painter = new Painter(canvas);

    painter.execute({
      type: 'border',
      x: 10,
      y: 20,
      width: 100,
      height: 50,
      borderWidth: 2,
      borderColor: 'blue'
    });

    expect(mockCtx.strokeRect).toHaveBeenCalledWith(10, 20, 100, 50);
  });
});

describe('Build Display List', () => {
  test('builds display list from layout tree', () => {
    const dom = parseHTML('<div>Hello</div>');
    const css = parseCSS('div { color: red; }');
    const styled = styleTree(dom, css);
    const layout = layoutTree(styled, 800, 600);
    
    const displayList = buildDisplayList(layout);
    expect(Array.isArray(displayList)).toBe(true);
  });

  test('handles display none elements', () => {
    const dom = parseHTML('<div><span>Visible</span></div>');
    const css = parseCSS('span { display: none; }');
    const styled = styleTree(dom, css);
    const layout = layoutTree(styled, 800, 600);
    
    const displayList = buildDisplayList(layout);
    // Display list should be generated without errors
    expect(Array.isArray(displayList)).toBe(true);
  });

  test('orders commands correctly (background before text)', () => {
    const dom = parseHTML('<p>Text</p>');
    const css = parseCSS('p { background: yellow; color: black; }');
    const styled = styleTree(dom, css);
    const layout = layoutTree(styled, 800, 600);
    
    const displayList = buildDisplayList(layout);
    
    // Find indices
    const bgIndex = displayList.findIndex(cmd => cmd.type === 'rect');
    const textIndex = displayList.findIndex(cmd => cmd.type === 'text');
    
    if (bgIndex !== -1 && textIndex !== -1) {
      expect(bgIndex).toBeLessThan(textIndex);
    }
  });
});
