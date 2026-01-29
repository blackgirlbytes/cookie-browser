/**
 * Layout Engine module for Cookie Browser's custom rendering engine
 * 
 * Usage:
 *   import { layoutTree } from './engine/layout';
 *   const layout = layoutTree(styledRoot, 800, 600);
 */

import type { StyledNode } from '../style';
import { layoutBlock, type LayoutNode } from './block';
import type { Rect } from './box';

export { type BoxDimensions, type Rect, type EdgeSizes, paddingBox, borderBox, marginBox, parseLength, parseEdges } from './box';
export { type LayoutNode, layoutBlock, getDisplayType } from './block';
export { layoutInline, wrapIntoLines } from './inline';

/**
 * Build a layout tree from a styled tree
 * @param styledRoot - The root of the styled tree
 * @param viewportWidth - The width of the viewport
 * @param viewportHeight - The height of the viewport (not used for initial layout)
 */
export function layoutTree(
  styledRoot: StyledNode,
  viewportWidth: number,
  _viewportHeight: number
): LayoutNode {
  // Create the initial containing block (the viewport)
  const initialContainingBlock: Rect = {
    x: 0,
    y: 0,
    width: viewportWidth,
    height: 0, // Height will be determined by content
  };
  
  // Layout the root element as a block
  return layoutBlock(styledRoot, initialContainingBlock);
}
