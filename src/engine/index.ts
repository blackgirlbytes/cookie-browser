/**
 * Cookie Rendering Engine
 * 
 * A custom rendering engine for Cookie Browser's internal pages.
 * 
 * @module engine
 */

// HTML Parser
export { parseHTML, type DOMNode, type NodeType } from './html';

// CSS Parser
export { parseCSS, type Stylesheet, type Rule, type Selector, type Declaration } from './css';

// Style Resolution
export { styleTree, type StyledNode, type StyleMap } from './style';

// Layout Engine
export { layoutTree, type LayoutBox, type BoxDimensions, type Rect } from './layout';

// Painting
export { render, Painter, type PaintCommand } from './paint';

// React Component
export { CookieRenderer } from './CookieRenderer';
