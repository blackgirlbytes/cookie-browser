/**
 * CookieRenderer - React component for the custom rendering engine
 * 
 * This component renders HTML/CSS content using Cookie Browser's
 * custom rendering engine instead of the browser's native renderer.
 */

import { useRef, useEffect, useCallback } from 'react';
import { render } from './paint';

interface CookieRendererProps {
  /** HTML content to render */
  html: string;
  /** CSS styles to apply */
  css: string;
  /** Canvas width (default: 800) */
  width?: number;
  /** Canvas height (default: 600) */
  height?: number;
  /** Callback when rendering is complete */
  onRender?: () => void;
  /** Additional CSS class for the canvas */
  className?: string;
  /** Additional inline styles for the canvas */
  style?: React.CSSProperties;
}

/**
 * CookieRenderer component
 * 
 * Renders HTML and CSS content to a canvas using the custom rendering engine.
 * 
 * @example
 * ```tsx
 * <CookieRenderer
 *   html="<div><h1>Hello</h1><p>World</p></div>"
 *   css="h1 { color: blue; } p { color: gray; }"
 *   width={800}
 *   height={600}
 * />
 * ```
 */
export function CookieRenderer({
  html,
  css,
  width = 800,
  height = 600,
  onRender,
  className,
  style
}: CookieRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const doRender = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      render(html, css, canvas);
      onRender?.();
    } catch (error) {
      console.error('CookieRenderer: Failed to render', error);
    }
  }, [html, css, onRender]);

  // Re-render when html, css, or dimensions change
  useEffect(() => {
    doRender();
  }, [doRender]);

  // Handle canvas resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Update canvas dimensions
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      doRender();
    }
  }, [width, height, doRender]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={className}
      style={{
        display: 'block',
        ...style
      }}
      data-testid="cookie-renderer-canvas"
    />
  );
}

export default CookieRenderer;
