/**
 * Paint module for Cookie Browser's custom rendering engine
 * 
 * Usage:
 *   import { render } from './engine/paint';
 *   render('<div>Hello</div>', 'div { color: red; }', canvas);
 */

export { Painter, paintLayoutNode, loadImage } from './canvas';
export { render, renderWithDefaults } from './render';
