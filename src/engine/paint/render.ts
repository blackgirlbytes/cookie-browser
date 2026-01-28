/**
 * Render Pipeline
 * Orchestrates the full rendering process from HTML/CSS to canvas
 */

import { parseHTML } from '../html';
import { parseCSS } from '../css';
import { styleTree } from '../style';
import { layoutTree } from '../layout';
import { Painter, buildDisplayList } from './canvas';

/**
 * Render HTML and CSS to a canvas
 * 
 * @param html - HTML string to render
 * @param css - CSS string for styling
 * @param canvas - Target canvas element
 */
export function render(html: string, css: string, canvas: HTMLCanvasElement): void {
  // 1. Parse HTML into DOM tree
  const dom = parseHTML(html);

  // 2. Parse CSS into stylesheet
  const stylesheet = parseCSS(css);

  // 3. Build styled tree
  const styledTree = styleTree(dom, stylesheet);

  // 4. Calculate layout
  const layoutRoot = layoutTree(styledTree, canvas.width, canvas.height);

  // 5. Build display list
  const displayList = buildDisplayList(layoutRoot);

  // 6. Paint to canvas
  const painter = new Painter(canvas);
  painter.clear();

  for (const command of displayList) {
    painter.execute(command);
  }
}

/**
 * Render with custom viewport dimensions
 * Useful when canvas size doesn't match desired layout dimensions
 */
export function renderWithViewport(
  html: string,
  css: string,
  canvas: HTMLCanvasElement,
  viewportWidth: number,
  viewportHeight: number
): void {
  const dom = parseHTML(html);
  const stylesheet = parseCSS(css);
  const styledTree = styleTree(dom, stylesheet);
  const layoutRoot = layoutTree(styledTree, viewportWidth, viewportHeight);
  const displayList = buildDisplayList(layoutRoot);

  const painter = new Painter(canvas);
  painter.clear();

  for (const command of displayList) {
    painter.execute(command);
  }
}

/**
 * Get the layout tree without rendering
 * Useful for debugging or hit testing
 */
export function getLayout(html: string, css: string, width: number, height: number) {
  const dom = parseHTML(html);
  const stylesheet = parseCSS(css);
  const styledTree = styleTree(dom, stylesheet);
  return layoutTree(styledTree, width, height);
}

/**
 * Get the display list without rendering
 * Useful for debugging or custom rendering
 */
export function getDisplayList(html: string, css: string, width: number, height: number) {
  const dom = parseHTML(html);
  const stylesheet = parseCSS(css);
  const styledTree = styleTree(dom, stylesheet);
  const layoutRoot = layoutTree(styledTree, width, height);
  return buildDisplayList(layoutRoot);
}
