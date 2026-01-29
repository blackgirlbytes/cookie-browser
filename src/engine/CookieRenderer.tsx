/**
 * CookieRenderer - React component for Cookie Browser's custom rendering engine
 * Renders HTML/CSS to a canvas using our custom engine
 */

import React, { useRef, useEffect } from 'react';
import { render } from './paint';

interface CookieRendererProps {
  html: string;
  css?: string;
  width?: number;
  height?: number;
  className?: string;
}

/**
 * React component that renders HTML/CSS using Cookie Browser's custom engine
 */
export const CookieRenderer: React.FC<CookieRendererProps> = ({
  html,
  css = '',
  width = 800,
  height = 600,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Update canvas dimensions
    canvas.width = width;
    canvas.height = height;

    // Render the content
    try {
      render(html, css, canvas);
    } catch (error) {
      console.error('CookieRenderer: Failed to render', error);
      
      // Draw error message on canvas
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffeeee';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = '#cc0000';
        ctx.font = '16px sans-serif';
        ctx.fillText('Rendering error - see console', 20, 30);
      }
    }
  }, [html, css, width, height]);

  return (
    <canvas
      ref={canvasRef}
      className={`cookie-renderer ${className}`}
      style={{
        display: 'block',
        maxWidth: '100%',
        height: 'auto',
      }}
      data-testid="cookie-renderer-canvas"
    />
  );
};

export default CookieRenderer;
