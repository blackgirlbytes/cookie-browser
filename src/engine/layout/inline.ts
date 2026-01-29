/**
 * Inline Layout for Cookie Browser's custom rendering engine
 * Handles layout for inline elements (span, a, strong, etc.)
 * 
 * Note: This is a simplified implementation. Full inline layout
 * requires line box calculations and text shaping.
 */

import type { StyledNode } from '../style';
import type { LayoutNode } from './block';
import { 
  type Rect,
  createEmptyBox, 
  parseLength, 
  parseEdges 
} from './box';

/**
 * Layout inline content within a line
 * Returns an array of layout nodes positioned horizontally
 */
export function layoutInline(
  styledNodes: StyledNode[],
  containingBlock: Rect
): LayoutNode[] {
  const layouts: LayoutNode[] = [];
  let currentX = containingBlock.x;
  const lineHeight = 20; // Default line height
  
  for (const styledNode of styledNodes) {
    const styles = styledNode.styles;
    const box = createEmptyBox();
    const fontSize = parseLength(styles.get('font-size'), 0, 16) || 16;
    
    // Parse margin, padding
    const marginValue = styles.get('margin');
    const paddingValue = styles.get('padding');
    
    if (marginValue) {
      box.margin = parseEdges(marginValue, containingBlock.width, fontSize);
    }
    if (paddingValue) {
      box.padding = parseEdges(paddingValue, containingBlock.width, fontSize);
    }
    
    // Position horizontally
    box.content.x = currentX + box.margin.left + box.padding.left;
    box.content.y = containingBlock.y + box.margin.top + box.padding.top;
    
    // Calculate width based on content (simplified)
    const widthValue = styles.get('width');
    if (widthValue && widthValue !== 'auto') {
      box.content.width = parseLength(widthValue, containingBlock.width, fontSize);
    } else {
      // Estimate width based on text content
      box.content.width = estimateTextWidth(styledNode, fontSize);
    }
    
    // Height is typically line height for inline elements
    box.content.height = lineHeight;
    
    layouts.push({
      styledNode,
      box,
      children: [], // Inline elements don't have block children in this model
      displayType: 'inline',
    });
    
    // Move X position for next inline element
    currentX = box.content.x + box.content.width + box.padding.right + box.margin.right;
  }
  
  return layouts;
}

/**
 * Estimate the width of text content (simplified)
 * In a real implementation, this would use font metrics
 */
function estimateTextWidth(styledNode: StyledNode, fontSize: number): number {
  const node = styledNode.node;
  
  if (node.type === 'text' && node.textContent) {
    // Rough estimate: average character width is about 0.5 * fontSize
    return node.textContent.length * fontSize * 0.5;
  }
  
  // For elements, sum up children widths
  let totalWidth = 0;
  for (const child of styledNode.children) {
    totalWidth += estimateTextWidth(child, fontSize);
  }
  
  return totalWidth || fontSize * 2; // Minimum width
}

/**
 * Wrap inline content into lines
 * Returns line boxes containing inline elements
 */
export function wrapIntoLines(
  inlineLayouts: LayoutNode[],
  maxWidth: number,
  startX: number,
  startY: number
): LayoutNode[][] {
  const lines: LayoutNode[][] = [];
  let currentLine: LayoutNode[] = [];
  let currentLineWidth = 0;
  let currentY = startY;
  const lineHeight = 20;
  
  for (const layout of inlineLayouts) {
    const elementWidth = layout.box.content.width + 
                         layout.box.margin.left + layout.box.margin.right +
                         layout.box.padding.left + layout.box.padding.right;
    
    // Check if element fits on current line
    if (currentLineWidth + elementWidth > maxWidth && currentLine.length > 0) {
      // Start new line
      lines.push(currentLine);
      currentLine = [];
      currentLineWidth = 0;
      currentY += lineHeight;
    }
    
    // Position element on current line
    layout.box.content.x = startX + currentLineWidth + layout.box.margin.left + layout.box.padding.left;
    layout.box.content.y = currentY + layout.box.margin.top + layout.box.padding.top;
    
    currentLine.push(layout);
    currentLineWidth += elementWidth;
  }
  
  // Don't forget the last line
  if (currentLine.length > 0) {
    lines.push(currentLine);
  }
  
  return lines;
}
