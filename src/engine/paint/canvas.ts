/**
 * Canvas Painter for Cookie Browser's custom rendering engine
 * Renders layout trees to HTML canvas
 */

import type { LayoutNode } from '../layout';
import { borderBox, paddingBox } from '../layout';

/**
 * Painter class that renders to a canvas
 */
export class Painter {
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get 2D context from canvas');
    }
    this.ctx = ctx;
    this.width = canvas.width;
    this.height = canvas.height;
  }

  /**
   * Clear the canvas
   */
  clear(): void {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  /**
   * Fill a rectangle with a color
   */
  fillRect(x: number, y: number, width: number, height: number, color: string): void {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x, y, width, height);
  }

  /**
   * Draw a border rectangle
   */
  strokeRect(
    x: number, 
    y: number, 
    width: number, 
    height: number, 
    color: string, 
    lineWidth: number
  ): void {
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = lineWidth;
    this.ctx.strokeRect(x, y, width, height);
  }

  /**
   * Draw text
   */
  fillText(
    text: string, 
    x: number, 
    y: number, 
    color: string, 
    font: string
  ): void {
    this.ctx.fillStyle = color;
    this.ctx.font = font;
    this.ctx.fillText(text, x, y);
  }

  /**
   * Draw an image
   */
  drawImage(
    img: HTMLImageElement, 
    x: number, 
    y: number, 
    width: number, 
    height: number
  ): void {
    this.ctx.drawImage(img, x, y, width, height);
  }

  /**
   * Get the canvas context (for advanced operations)
   */
  getContext(): CanvasRenderingContext2D {
    return this.ctx;
  }
}

/**
 * Paint a layout node and its children
 */
export function paintLayoutNode(painter: Painter, layoutNode: LayoutNode): void {
  // Skip display: none elements
  if (layoutNode.displayType === 'none') {
    return;
  }

  // 1. Paint background
  paintBackground(painter, layoutNode);

  // 2. Paint borders
  paintBorders(painter, layoutNode);

  // 3. Paint text content
  paintText(painter, layoutNode);

  // 4. Paint children
  for (const child of layoutNode.children) {
    paintLayoutNode(painter, child);
  }
}

/**
 * Paint the background of an element
 */
function paintBackground(painter: Painter, layoutNode: LayoutNode): void {
  const styles = layoutNode.styledNode.styles;
  const background = styles.get('background') || styles.get('background-color');

  if (background && background !== 'transparent') {
    const pBox = paddingBox(layoutNode.box);
    painter.fillRect(pBox.x, pBox.y, pBox.width, pBox.height, background);
  }
}

/**
 * Paint the borders of an element
 */
function paintBorders(painter: Painter, layoutNode: LayoutNode): void {
  const styles = layoutNode.styledNode.styles;
  const box = layoutNode.box;
  const bBox = borderBox(box);

  // Check if there are any borders to paint
  const borderWidth = box.border.top + box.border.right + box.border.bottom + box.border.left;
  if (borderWidth === 0) {
    return;
  }

  // Get border color (default to black)
  const borderStyle = styles.get('border');
  let borderColor = 'black';
  
  if (borderStyle) {
    // Parse border shorthand (e.g., "1px solid black")
    const parts = borderStyle.split(/\s+/);
    if (parts.length >= 3) {
      borderColor = parts[2];
    }
  }

  // Draw top border
  if (box.border.top > 0) {
    painter.fillRect(bBox.x, bBox.y, bBox.width, box.border.top, borderColor);
  }

  // Draw right border
  if (box.border.right > 0) {
    painter.fillRect(bBox.x + bBox.width - box.border.right, bBox.y, box.border.right, bBox.height, borderColor);
  }

  // Draw bottom border
  if (box.border.bottom > 0) {
    painter.fillRect(bBox.x, bBox.y + bBox.height - box.border.bottom, bBox.width, box.border.bottom, borderColor);
  }

  // Draw left border
  if (box.border.left > 0) {
    painter.fillRect(bBox.x, bBox.y, box.border.left, bBox.height, borderColor);
  }
}

/**
 * Paint text content
 */
function paintText(painter: Painter, layoutNode: LayoutNode): void {
  const node = layoutNode.styledNode.node;
  const styles = layoutNode.styledNode.styles;
  const box = layoutNode.box;

  // Only paint text nodes
  if (node.type !== 'text' || !node.textContent) {
    return;
  }

  const text = node.textContent;
  const color = styles.get('color') || 'black';
  const fontSize = styles.get('font-size') || '16px';
  const fontFamily = styles.get('font-family') || 'serif';
  const fontWeight = styles.get('font-weight') || 'normal';
  const fontStyle = styles.get('font-style') || 'normal';

  // Build font string
  const font = `${fontStyle} ${fontWeight} ${fontSize} ${fontFamily}`;

  // Position text (baseline is at bottom of content box)
  const x = box.content.x;
  const y = box.content.y + box.content.height * 0.8; // Approximate baseline

  painter.fillText(text, x, y, color, font);
}

/**
 * Load an image and return a promise
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
