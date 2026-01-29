/**
 * Cookie Browser Custom Rendering Engine
 * 
 * A complete rendering pipeline for internal pages:
 * HTML → DOM → Styled DOM → Layout → Paint
 * 
 * Usage:
 *   import { CookieRenderer } from './engine';
 *   <CookieRenderer html="<div>Hello</div>" css="div { color: red; }" />
 */

// Main React component
export { CookieRenderer, default } from './CookieRenderer';

// HTML Parser
export { parseHTML, serializeHTML } from './html';
export type { DOMNode, NodeType } from './html';

// CSS Parser
export { parseCSS, serializeCSS } from './css';
export type { Stylesheet, Rule, Declaration, Selector, SelectorType } from './css';

// Style Resolution
export { styleTree, getStyle, matchesSelector, calculateSpecificity } from './style';
export type { StyledNode, ComputedStyles, Specificity } from './style';

// Layout Engine
export { layoutTree, layoutBlock, marginBox, borderBox, paddingBox } from './layout';
export type { LayoutNode, BoxDimensions, Rect, EdgeSizes } from './layout';

// Painting
export { render, renderWithDefaults, Painter, paintLayoutNode } from './paint';
