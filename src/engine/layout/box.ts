/**
 * Box Model types for Cookie Browser's custom rendering engine
 * Defines the CSS box model (content, padding, border, margin)
 */

/**
 * Rectangle with position and dimensions
 */
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Edge sizes (for margin, padding, border)
 */
export interface EdgeSizes {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/**
 * The complete box model for an element
 */
export interface BoxDimensions {
  // Position and size of content area
  content: Rect;
  
  // Surrounding edges
  padding: EdgeSizes;
  border: EdgeSizes;
  margin: EdgeSizes;
}

/**
 * Create a zero-sized box at origin
 */
export function createEmptyBox(): BoxDimensions {
  return {
    content: { x: 0, y: 0, width: 0, height: 0 },
    padding: { top: 0, right: 0, bottom: 0, left: 0 },
    border: { top: 0, right: 0, bottom: 0, left: 0 },
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
  };
}

/**
 * Get the padding box (content + padding)
 */
export function paddingBox(box: BoxDimensions): Rect {
  return {
    x: box.content.x - box.padding.left,
    y: box.content.y - box.padding.top,
    width: box.content.width + box.padding.left + box.padding.right,
    height: box.content.height + box.padding.top + box.padding.bottom,
  };
}

/**
 * Get the border box (content + padding + border)
 */
export function borderBox(box: BoxDimensions): Rect {
  const pBox = paddingBox(box);
  return {
    x: pBox.x - box.border.left,
    y: pBox.y - box.border.top,
    width: pBox.width + box.border.left + box.border.right,
    height: pBox.height + box.border.top + box.border.bottom,
  };
}

/**
 * Get the margin box (content + padding + border + margin)
 */
export function marginBox(box: BoxDimensions): Rect {
  const bBox = borderBox(box);
  return {
    x: bBox.x - box.margin.left,
    y: bBox.y - box.margin.top,
    width: bBox.width + box.margin.left + box.margin.right,
    height: bBox.height + box.margin.top + box.margin.bottom,
  };
}

/**
 * Parse a CSS length value (e.g., "10px", "1em", "50%")
 * Returns the numeric value in pixels (for now, only px is fully supported)
 */
export function parseLength(value: string | undefined, containerSize: number = 0, fontSize: number = 16): number {
  if (!value) return 0;
  
  value = value.trim();
  
  if (value === '0' || value === 'auto') {
    return 0;
  }
  
  // Percentage
  if (value.endsWith('%')) {
    const percent = parseFloat(value);
    return (percent / 100) * containerSize;
  }
  
  // Pixels
  if (value.endsWith('px')) {
    return parseFloat(value);
  }
  
  // Em units
  if (value.endsWith('em')) {
    return parseFloat(value) * fontSize;
  }
  
  // Rem units (assume root font size is 16px)
  if (value.endsWith('rem')) {
    return parseFloat(value) * 16;
  }
  
  // Plain number (treat as pixels)
  const num = parseFloat(value);
  return isNaN(num) ? 0 : num;
}

/**
 * Parse a shorthand margin/padding value
 * Supports: "10px", "10px 20px", "10px 20px 30px", "10px 20px 30px 40px"
 */
export function parseEdges(value: string | undefined, containerSize: number = 0, fontSize: number = 16): EdgeSizes {
  if (!value) {
    return { top: 0, right: 0, bottom: 0, left: 0 };
  }
  
  const parts = value.trim().split(/\s+/);
  
  switch (parts.length) {
    case 1: {
      const v = parseLength(parts[0], containerSize, fontSize);
      return { top: v, right: v, bottom: v, left: v };
    }
    case 2: {
      const vertical = parseLength(parts[0], containerSize, fontSize);
      const horizontal = parseLength(parts[1], containerSize, fontSize);
      return { top: vertical, right: horizontal, bottom: vertical, left: horizontal };
    }
    case 3: {
      const top = parseLength(parts[0], containerSize, fontSize);
      const horizontal = parseLength(parts[1], containerSize, fontSize);
      const bottom = parseLength(parts[2], containerSize, fontSize);
      return { top, right: horizontal, bottom, left: horizontal };
    }
    case 4:
    default: {
      return {
        top: parseLength(parts[0], containerSize, fontSize),
        right: parseLength(parts[1], containerSize, fontSize),
        bottom: parseLength(parts[2], containerSize, fontSize),
        left: parseLength(parts[3], containerSize, fontSize),
      };
    }
  }
}
