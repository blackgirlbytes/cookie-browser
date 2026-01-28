/**
 * Block Layout
 * Handles layout for block-level elements (display: block)
 */

import type { StyledNode } from '../style';
import { 
  type BoxDimensions, 
  type Rect,
  createDefaultBox, 
  parseLength, 
  parseEdges,
  marginBox 
} from './box';

export interface LayoutBox {
  box: BoxDimensions;
  styledNode: StyledNode;
  children: LayoutBox[];
  displayType: 'block' | 'inline' | 'none';
}

/**
 * Layout a block-level element
 */
export function layoutBlock(
  styledNode: StyledNode,
  containingBlock: Rect
): LayoutBox {
  const box = createDefaultBox();
  const styles = styledNode.styles;

  // Calculate width first (depends on containing block)
  calculateBlockWidth(box, styles, containingBlock);

  // Position the box
  box.content.x = containingBlock.x + box.margin.left + box.border.left + box.padding.left;
  box.content.y = containingBlock.y;

  // Layout children and calculate height
  const children = layoutBlockChildren(styledNode, box);
  
  // Calculate height based on children or explicit height
  calculateBlockHeight(box, styles, children, containingBlock);

  return {
    box,
    styledNode,
    children,
    displayType: 'block'
  };
}

/**
 * Calculate the width of a block element
 */
function calculateBlockWidth(
  box: BoxDimensions,
  styles: Record<string, string>,
  containingBlock: Rect
): void {
  const containerWidth = containingBlock.width;

  // Parse margin, padding, border
  box.margin = parseEdges(styles.margin, containerWidth);
  box.padding = parseEdges(styles.padding, containerWidth);
  box.border = parseEdges(styles.border, containerWidth);

  // Also check individual properties
  if (styles['margin-left']) box.margin.left = parseLength(styles['margin-left'], containerWidth);
  if (styles['margin-right']) box.margin.right = parseLength(styles['margin-right'], containerWidth);
  if (styles['margin-top']) box.margin.top = parseLength(styles['margin-top'], containerWidth);
  if (styles['margin-bottom']) box.margin.bottom = parseLength(styles['margin-bottom'], containerWidth);

  if (styles['padding-left']) box.padding.left = parseLength(styles['padding-left'], containerWidth);
  if (styles['padding-right']) box.padding.right = parseLength(styles['padding-right'], containerWidth);
  if (styles['padding-top']) box.padding.top = parseLength(styles['padding-top'], containerWidth);
  if (styles['padding-bottom']) box.padding.bottom = parseLength(styles['padding-bottom'], containerWidth);

  // Calculate width
  const widthValue = styles.width;
  
  if (widthValue && widthValue !== 'auto') {
    // Explicit width
    box.content.width = parseLength(widthValue, containerWidth);
  } else {
    // Auto width: fill available space
    const totalHorizontal = 
      box.margin.left + box.border.left + box.padding.left +
      box.padding.right + box.border.right + box.margin.right;
    
    box.content.width = Math.max(0, containerWidth - totalHorizontal);
  }
}

/**
 * Calculate the height of a block element
 */
function calculateBlockHeight(
  box: BoxDimensions,
  styles: Record<string, string>,
  children: LayoutBox[],
  containingBlock: Rect
): void {
  const heightValue = styles.height;

  if (heightValue && heightValue !== 'auto') {
    // Explicit height
    box.content.height = parseLength(heightValue, containingBlock.height);
  } else {
    // Auto height: sum of children heights
    let totalHeight = 0;
    for (const child of children) {
      const childMarginBox = marginBox(child.box);
      totalHeight += childMarginBox.height;
    }
    box.content.height = totalHeight;
  }
}

/**
 * Layout children of a block element
 */
function layoutBlockChildren(
  styledNode: StyledNode,
  parentBox: BoxDimensions
): LayoutBox[] {
  const children: LayoutBox[] = [];
  let currentY = parentBox.content.y;

  // Create containing block for children
  const containingBlock: Rect = {
    x: parentBox.content.x,
    y: currentY,
    width: parentBox.content.width,
    height: 0 // Will be calculated
  };

  for (const child of styledNode.children) {
    const display = child.styles.display || 'inline';

    if (display === 'none') {
      continue;
    }

    // Update Y position for this child
    containingBlock.y = currentY;

    let childLayout: LayoutBox;

    if (display === 'block' || display === 'list-item') {
      childLayout = layoutBlock(child, containingBlock);
    } else {
      // Treat inline elements as anonymous block boxes for simplicity
      childLayout = layoutInlineAsBlock(child, containingBlock);
    }

    // Move Y position down for next child
    const childMarginBox = marginBox(childLayout.box);
    currentY += childMarginBox.height;

    children.push(childLayout);
  }

  return children;
}

/**
 * Layout an inline element as if it were a block (simplified)
 */
function layoutInlineAsBlock(
  styledNode: StyledNode,
  containingBlock: Rect
): LayoutBox {
  const box = createDefaultBox();
  const styles = styledNode.styles;

  // Parse edges
  box.margin = parseEdges(styles.margin, containingBlock.width);
  box.padding = parseEdges(styles.padding, containingBlock.width);
  box.border = parseEdges(styles.border, containingBlock.width);

  // Position
  box.content.x = containingBlock.x + box.margin.left + box.border.left + box.padding.left;
  box.content.y = containingBlock.y + box.margin.top + box.border.top + box.padding.top;

  // For text nodes, estimate height based on font size
  if (styledNode.node.type === 'text') {
    const fontSize = parseLength(styles['font-size'], 16) || 16;
    const lineHeight = fontSize * 1.2; // Default line height
    box.content.height = lineHeight;
    box.content.width = containingBlock.width - 
      (box.margin.left + box.border.left + box.padding.left +
       box.padding.right + box.border.right + box.margin.right);
  } else {
    // Layout children
    const children = layoutBlockChildren(styledNode, box);
    
    // Calculate height from children
    let totalHeight = 0;
    for (const child of children) {
      totalHeight += marginBox(child.box).height;
    }
    box.content.height = totalHeight;
    box.content.width = containingBlock.width -
      (box.margin.left + box.border.left + box.padding.left +
       box.padding.right + box.border.right + box.margin.right);

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
