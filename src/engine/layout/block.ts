/**
 * Block Layout for Cookie Browser's custom rendering engine
 * Handles layout for block-level elements (div, p, h1, etc.)
 */

import type { StyledNode, ComputedStyles } from '../style';
import { 
  type BoxDimensions, 
  type Rect,
  createEmptyBox, 
  parseLength, 
  parseEdges,
  marginBox 
} from './box';

/**
 * Layout node - a styled node with computed box dimensions
 */
export interface LayoutNode {
  styledNode: StyledNode;
  box: BoxDimensions;
  children: LayoutNode[];
  displayType: 'block' | 'inline' | 'inline-block' | 'none';
}

/**
 * Get the display type from computed styles
 */
export function getDisplayType(styles: ComputedStyles): 'block' | 'inline' | 'inline-block' | 'none' {
  const display = styles.get('display') || 'inline';
  
  switch (display) {
    case 'block':
      return 'block';
    case 'inline-block':
      return 'inline-block';
    case 'none':
      return 'none';
    default:
      return 'inline';
  }
}

/**
 * Layout a block-level element
 */
export function layoutBlock(
  styledNode: StyledNode,
  containingBlock: Rect
): LayoutNode {
  const styles = styledNode.styles;
  const displayType = getDisplayType(styles);
  
  // Skip elements with display: none
  if (displayType === 'none') {
    return {
      styledNode,
      box: createEmptyBox(),
      children: [],
      displayType: 'none',
    };
  }
  
  const box = createEmptyBox();
  const fontSize = parseLength(styles.get('font-size'), 0, 16) || 16;
  
  // Calculate width
  calculateBlockWidth(box, styles, containingBlock, fontSize);
  
  // Position the box
  box.content.x = containingBlock.x + box.margin.left + box.border.left + box.padding.left;
  box.content.y = containingBlock.y + containingBlock.height + box.margin.top + box.border.top + box.padding.top;
  
  // Layout children
  const children = layoutChildren(styledNode, box);
  
  // Calculate height based on children
  calculateBlockHeight(box, styles, children, fontSize);
  
  return {
    styledNode,
    box,
    children,
    displayType,
  };
}

/**
 * Calculate the width of a block element
 */
function calculateBlockWidth(
  box: BoxDimensions,
  styles: ComputedStyles,
  containingBlock: Rect,
  fontSize: number
): void {
  const containerWidth = containingBlock.width;
  
  // Parse margin, padding, border
  const marginValue = styles.get('margin');
  const paddingValue = styles.get('padding');
  
  // Handle individual properties or shorthand
  if (marginValue) {
    box.margin = parseEdges(marginValue, containerWidth, fontSize);
  } else {
    box.margin = {
      top: parseLength(styles.get('margin-top'), containerWidth, fontSize),
      right: parseLength(styles.get('margin-right'), containerWidth, fontSize),
      bottom: parseLength(styles.get('margin-bottom'), containerWidth, fontSize),
      left: parseLength(styles.get('margin-left'), containerWidth, fontSize),
    };
  }
  
  if (paddingValue) {
    box.padding = parseEdges(paddingValue, containerWidth, fontSize);
  } else {
    box.padding = {
      top: parseLength(styles.get('padding-top'), containerWidth, fontSize),
      right: parseLength(styles.get('padding-right'), containerWidth, fontSize),
      bottom: parseLength(styles.get('padding-bottom'), containerWidth, fontSize),
      left: parseLength(styles.get('padding-left'), containerWidth, fontSize),
    };
  }
  
  // Parse border width (simplified - just width, not full border shorthand)
  const borderWidth = parseLength(styles.get('border-width'), 0, fontSize);
  box.border = { top: borderWidth, right: borderWidth, bottom: borderWidth, left: borderWidth };
  
  // Calculate content width
  const widthValue = styles.get('width');
  
  if (widthValue && widthValue !== 'auto') {
    box.content.width = parseLength(widthValue, containerWidth, fontSize);
  } else {
    // Auto width: fill available space
    const total = box.margin.left + box.margin.right +
                  box.border.left + box.border.right +
                  box.padding.left + box.padding.right;
    box.content.width = Math.max(0, containerWidth - total);
  }
}

/**
 * Calculate the height of a block element
 */
function calculateBlockHeight(
  box: BoxDimensions,
  styles: ComputedStyles,
  children: LayoutNode[],
  fontSize: number
): void {
  const heightValue = styles.get('height');
  
  if (heightValue && heightValue !== 'auto') {
    box.content.height = parseLength(heightValue, 0, fontSize);
  } else {
    // Auto height: sum of children heights
    let totalHeight = 0;
    
    for (const child of children) {
      const childMarginBox = marginBox(child.box);
      totalHeight += childMarginBox.height;
    }
    
    // For text nodes, estimate height based on font size
    if (children.length === 0 && styledNodeHasText(box)) {
      totalHeight = fontSize * 1.2; // Line height approximation
    }
    
    box.content.height = totalHeight;
  }
}

/**
 * Check if a box might contain text (heuristic)
 */
function styledNodeHasText(_box: BoxDimensions): boolean {
  // This is a simplified check - in reality we'd check the DOM node
  return false;
}

/**
 * Layout children of a block element
 */
function layoutChildren(
  styledNode: StyledNode,
  parentBox: BoxDimensions
): LayoutNode[] {
  const children: LayoutNode[] = [];
  let currentY = 0;
  
  for (const child of styledNode.children) {
    const displayType = getDisplayType(child.styles);
    
    if (displayType === 'none') {
      continue;
    }
    
    // Create containing block for child
    const containingBlock: Rect = {
      x: parentBox.content.x,
      y: parentBox.content.y + currentY,
      width: parentBox.content.width,
      height: 0, // Will be filled by child
    };
    
    // Layout child based on display type
    let childLayout: LayoutNode;
    
    if (displayType === 'block') {
      childLayout = layoutBlock(child, containingBlock);
    } else {
      // For inline elements, treat as inline-block for simplicity
      childLayout = layoutInlineBlock(child, containingBlock);
    }
    
    children.push(childLayout);
    
    // Move Y position for next child (block elements stack vertically)
    if (displayType === 'block') {
      const childMarginBox = marginBox(childLayout.box);
      currentY += childMarginBox.height;
    }
  }
  
  return children;
}

/**
 * Layout an inline-block element (simplified)
 */
function layoutInlineBlock(
  styledNode: StyledNode,
  containingBlock: Rect
): LayoutNode {
  const styles = styledNode.styles;
  const displayType = getDisplayType(styles);
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
  
  // Position
  box.content.x = containingBlock.x + box.margin.left + box.padding.left;
  box.content.y = containingBlock.y + box.margin.top + box.padding.top;
  
  // Width and height
  const widthValue = styles.get('width');
  const heightValue = styles.get('height');
  
  if (widthValue && widthValue !== 'auto') {
    box.content.width = parseLength(widthValue, containingBlock.width, fontSize);
  } else {
    // Shrink to fit content (simplified - use a default)
    box.content.width = 100; // Default width for inline elements
  }
  
  if (heightValue && heightValue !== 'auto') {
    box.content.height = parseLength(heightValue, 0, fontSize);
  } else {
    // Use line height
    box.content.height = fontSize * 1.2;
  }
  
  // Layout children recursively
  const children = layoutChildren(styledNode, box);
  
  // Adjust height if children are taller
  let childrenHeight = 0;
  for (const child of children) {
    const childMarginBox = marginBox(child.box);
    childrenHeight += childMarginBox.height;
  }
  if (childrenHeight > box.content.height) {
    box.content.height = childrenHeight;
  }
  
  return {
    styledNode,
    box,
    children,
    displayType,
  };
}
