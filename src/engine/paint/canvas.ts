/**
 * Canvas Painter
 * Handles rendering to an HTML canvas element
 */

import type { LayoutBox } from '../layout';
import { borderBox } from '../layout';

export interface PaintCommand {
  type: 'rect' | 'text' | 'border';
  x: number;
  y: number;
  width?: number;
  height?: number;
  color?: string;
  text?: string;
  font?: string;
  borderWidth?: number;
  borderColor?: string;
}

/**
 * Canvas Painter class
 * Manages rendering operations on a canvas
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
   * Fill a rectangle
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
  fillText(text: string, x: number, y: number, color: string, font: string): void {
    this.ctx.fillStyle = color;
    this.ctx.font = font;
    this.ctx.fillText(text, x, y);
  }

  /**
   * Execute a paint command
   */
  execute(command: PaintCommand): void {
    switch (command.type) {
      case 'rect':
        if (command.width && command.height && command.color) {
          this.fillRect(command.x, command.y, command.width, command.height, command.color);
        }
        break;

      case 'text':
        if (command.text && command.color && command.font) {
          this.fillText(command.text, command.x, command.y, command.color, command.font);
        }
        break;

      case 'border':
        if (command.width && command.height && command.borderColor && command.borderWidth) {
          this.strokeRect(
            command.x, 
            command.y, 
            command.width, 
            command.height, 
            command.borderColor, 
            command.borderWidth
          );
        }
        break;
    }
  }

  /**
   * Get the canvas context (for advanced operations)
   */
  getContext(): CanvasRenderingContext2D {
    return this.ctx;
  }
}

/**
 * Build a display list (list of paint commands) from a layout tree
 */
export function buildDisplayList(layoutBox: LayoutBox): PaintCommand[] {
  const commands: PaintCommand[] = [];
  
  renderLayoutBox(layoutBox, commands);
  
  return commands;
}

/**
 * Render a single layout box to the display list
 */
function renderLayoutBox(layoutBox: LayoutBox, commands: PaintCommand[]): void {
  // Skip if display is none
  if (layoutBox.displayType === 'none') {
    return;
  }

  const styles = layoutBox.styledNode.styles;
  const box = layoutBox.box;

  // 1. Render background
  const backgroundColor = styles['background-color'] || styles.background;
  if (backgroundColor && backgroundColor !== 'transparent') {
    const bBox = borderBox(box);
    commands.push({
      type: 'rect',
      x: bBox.x,
      y: bBox.y,
      width: bBox.width,
      height: bBox.height,
      color: backgroundColor
    });
  }

  // 2. Render borders
  const borderStyle = styles.border;
  if (borderStyle && borderStyle !== 'none') {
    // Parse border shorthand (e.g., "1px solid black")
    const borderParts = borderStyle.split(/\s+/);
    const borderWidth = parseFloat(borderParts[0]) || 1;
    const borderColor = borderParts[2] || borderParts[1] || 'black';
    
    const bBox = borderBox(box);
    commands.push({
      type: 'border',
      x: bBox.x,
      y: bBox.y,
      width: bBox.width,
      height: bBox.height,
      borderWidth,
      borderColor
    });
  }

  // 3. Render text content
  if (layoutBox.styledNode.node.type === 'text') {
    const text = layoutBox.styledNode.node.textContent || '';
    if (text.trim()) {
      const color = styles.color || 'black';
      const fontSize = styles['font-size'] || '16px';
      const fontFamily = styles['font-family'] || 'serif';
      const fontWeight = styles['font-weight'] || 'normal';
      const fontStyle = styles['font-style'] || 'normal';
      
      const font = `${fontStyle} ${fontWeight} ${fontSize} ${fontFamily}`;
      
      // Position text at baseline (approximately)
      const fontSizeNum = parseFloat(fontSize) || 16;
      const textY = box.content.y + fontSizeNum * 0.8;
      
      commands.push({
        type: 'text',
        x: box.content.x,
        y: textY,
        text: text,
        color,
        font
      });
    }
  }

  // 4. Render children
  for (const child of layoutBox.children) {
    renderLayoutBox(child, commands);
  }
}
