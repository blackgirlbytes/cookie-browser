/**
 * Layout Engine Module
 * 
 * Calculates the position and size of every element in the render tree.
 */

import type { StyledNode } from '../style';
import { layoutBlock, type LayoutBox } from './block';
import type { Rect } from './box';

export { 
  type BoxDimensions, 
  type Rect, 
  type EdgeSizes,
  createDefaultBox,
  paddingBox,
  borderBox,
  marginBox,
  parseLength,
  parseEdges
} from './box';

export { type LayoutBox, layoutBlock } from './block';
export { layoutInline, getBaseline, alignInlineBoxes } from './inline';

/**
 * Build a layout tree from a styled tree
 * 
 * @param styledRoot - The root of the styled tree
 * @param viewportWidth - Width of the viewport in pixels
 * @param viewportHeight - Height of the viewport in pixels
 * @returns The root layout box
 */
export function layoutTree(
  styledRoot: StyledNode,
  viewportWidth: number,
  viewportHeight: number
): LayoutBox {
  // Create the initial containing block (the viewport)
  const initialContainingBlock: Rect = {
    x: 0,
    y: 0,
    width: viewportWidth,
    height: viewportHeight
  };

  // Start layout from the root
  return layoutBlock(styledRoot, initialContainingBlock);
}

/**
 * Get all layout boxes in the tree (flattened)
 */
export function getAllLayoutBoxes(root: LayoutBox): LayoutBox[] {
  const boxes: LayoutBox[] = [root];
  
  for (const child of root.children) {
    boxes.push(...getAllLayoutBoxes(child));
  }
  
  return boxes;
}

/**
 * Find a layout box at a specific point
 */
export function hitTest(root: LayoutBox, x: number, y: number): LayoutBox | null {
  // Check children first (they're on top)
  for (const child of root.children) {
    const hit = hitTest(child, x, y);
    if (hit) return hit;
  }

  // Check this box
  const box = root.box;
  if (
    x >= box.content.x &&
    x <= box.content.x + box.content.width &&
    y >= box.content.y &&
    y <= box.content.y + box.content.height
  ) {
    return root;
  }

  return null;
}

/**
 * Calculate the total height of the layout tree
 */
export function getTotalHeight(root: LayoutBox): number {
  let maxY = root.box.content.y + root.box.content.height +
    root.box.padding.bottom + root.box.border.bottom + root.box.margin.bottom;

  for (const child of root.children) {
    const childMaxY = getTotalHeight(child);
    maxY = Math.max(maxY, childMaxY);
  }

  return maxY;
}

/**
 * Calculate the total width of the layout tree
 */
export function getTotalWidth(root: LayoutBox): number {
  let maxX = root.box.content.x + root.box.content.width +
    root.box.padding.right + root.box.border.right + root.box.margin.right;

  for (const child of root.children) {
    const childMaxX = getTotalWidth(child);
    maxX = Math.max(maxX, childMaxX);
  }

  return maxX;
}
