/**
 * Inline Layout
 * Handles layout for inline elements (display: inline)
 * 
 * Note: This is a simplified implementation. A full inline layout
 * would handle line breaking, text wrapping, and inline formatting contexts.
 */

import type { StyledNode } from '../style';
import { 
  type Rect,
  createDefaultBox, 
  parseLength, 
  parseEdges 
} from './box';
import type { LayoutBox } from './block';

/**
 * Layout inline content within a line
 * Returns an array of inline boxes that fit on the line
 */
export function layoutInline(
  styledNode: StyledNode,
  containingBlock: Rect
): LayoutBox {
  const box = createDefaultBox();
  const styles = styledNode.styles;

  // Parse edges (inline elements only have horizontal margin/padding/border)
  const margin = parseEdges(styles.margin, containingBlock.width);
  const padding = parseEdges(styles.padding, containingBlock.width);
  const border = parseEdges(styles.border, containingBlock.width);

  box.margin = margin;
  box.padding = padding;
  box.border = border;

  // Position
  box.content.x = containingBlock.x + margin.left + border.left + padding.left;
  box.content.y = containingBlock.y;

  // For text nodes, calculate dimensions based on content
  if (styledNode.node.type === 'text') {
    const text = styledNode.node.textContent || '';
    const fontSize = parseLength(styles['font-size'], 16) || 16;
    
    // Estimate width based on character count (very simplified)
    // A real implementation would measure actual text width
    const avgCharWidth = fontSize * 0.6;
    box.content.width = text.length * avgCharWidth;
    box.content.height = fontSize * 1.2; // Line height
  } else {
    // For inline elements with children, layout children horizontally
    const children: LayoutBox[] = [];
    let currentX = box.content.x;
    let maxHeight = 0;

    for (const child of styledNode.children) {
      const childContaining: Rect = {
        x: currentX,
        y: containingBlock.y,
        width: containingBlock.width - (currentX - containingBlock.x),
        height: containingBlock.height
      };

      const childLayout = layoutInline(child, childContaining);
      children.push(childLayout);

      currentX += childLayout.box.content.width + 
        childLayout.box.margin.left + childLayout.box.margin.right +
        childLayout.box.padding.left + childLayout.box.padding.right +
        childLayout.box.border.left + childLayout.box.border.right;

      maxHeight = Math.max(maxHeight, 
        childLayout.box.content.height +
        childLayout.box.padding.top + childLayout.box.padding.bottom +
        childLayout.box.border.top + childLayout.box.border.bottom
      );
    }

    box.content.width = currentX - box.content.x;
    box.content.height = maxHeight || parseLength(styles['font-size'], 16) * 1.2;

    return {
      box,
      styledNode,
      children,
      displayType: 'inline'
    };
  }

  return {
    box,
    styledNode,
    children: [],
    displayType: 'inline'
  };
}

/**
 * Calculate the baseline of an inline box
 * Used for vertical alignment
 */
export function getBaseline(layoutBox: LayoutBox): number {
  const fontSize = parseLength(layoutBox.styledNode.styles['font-size'], 16) || 16;
  // Simplified: baseline is at 80% of font size from top
  return layoutBox.box.content.y + fontSize * 0.8;
}

/**
 * Align inline boxes vertically within a line
 */
export function alignInlineBoxes(boxes: LayoutBox[], lineTop: number): void {
  if (boxes.length === 0) return;

  // Find the tallest box
  let maxHeight = 0;
  for (const box of boxes) {
    const totalHeight = box.box.content.height +
      box.box.padding.top + box.box.padding.bottom +
      box.box.border.top + box.box.border.bottom;
    maxHeight = Math.max(maxHeight, totalHeight);
  }

  // Align each box (default: baseline alignment simplified to bottom alignment)
  for (const box of boxes) {
    const totalHeight = box.box.content.height +
      box.box.padding.top + box.box.padding.bottom +
      box.box.border.top + box.box.border.bottom;
    
    // Align to bottom of line
    const offset = maxHeight - totalHeight;
    box.box.content.y = lineTop + offset + box.box.padding.top + box.box.border.top;
  }
}
