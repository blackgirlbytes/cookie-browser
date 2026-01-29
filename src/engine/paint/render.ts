/**
 * Render function for Cookie Browser's custom rendering engine
 * High-level API for rendering HTML/CSS to canvas
 */

import { parseHTML } from '../html';
import { parseCSS } from '../css';
import { styleTree } from '../style';
import { layoutTree } from '../layout';
import { Painter, paintLayoutNode } from './canvas';

/**
 * Render HTML and CSS to a canvas
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

  // 4. Build layout tree
  const layoutRoot = layoutTree(styledTree, canvas.width, canvas.height);

  // 5. Paint to canvas
  const painter = new Painter(canvas);
  painter.clear();
  paintLayoutNode(painter, layoutRoot);
}

/**
 * Render with a default stylesheet for internal pages
 */
export function renderWithDefaults(html: string, canvas: HTMLCanvasElement): void {
  const defaultCSS = `
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 16px;
      color: #333;
      background: #fff;
      margin: 0;
      padding: 20px;
    }
    h1 {
      font-size: 2em;
      margin-bottom: 0.5em;
      color: #1a1a1a;
    }
    h2 {
      font-size: 1.5em;
      margin-bottom: 0.5em;
      color: #1a1a1a;
    }
    p {
      margin-bottom: 1em;
      line-height: 1.5;
    }
    a {
      color: #0066cc;
      text-decoration: underline;
    }
    .card {
      background: #f5f5f5;
      border: 1px solid #ddd;
      padding: 16px;
      margin-bottom: 16px;
    }
  `;

  render(html, defaultCSS, canvas);
}
