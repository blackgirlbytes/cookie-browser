/**
 * Box Model Types
 * Defines the box model for layout calculations
 */

/**
 * Represents a rectangular area
 */
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Represents edge sizes (margin, padding, border)
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
  // Position and size of the content area
  content: Rect;
  
  // Surrounding edges
  padding: EdgeSizes;
  border: EdgeSizes;
  margin: EdgeSizes;
}

/**
 * Create a default box with all zeros
 */
export function createDefaultBox(): BoxDimensions {
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
 * Returns the numeric value in pixels (simplified - assumes 16px base font)
 */
export function parseLength(value: string | undefined, containerSize: number = 0): number {
  if (!value || value === 'auto' || value === 'none') {
    return 0;
  }

  const num = parseFloat(value);
  if (isNaN(num)) {
    return 0;
  }

  if (value.endsWith('%')) {
    return (num / 100) * containerSize;
  }

  if (value.endsWith('em')) {
    return num * 16; // Simplified: assume 16px base font
  }

  if (value.endsWith('rem')) {
    return num * 16;
  }

  // Default to pixels
  return num;
}

/**
 * Parse edge values (margin, padding) which can be shorthand
 * e.g., "10px" -> all sides, "10px 20px" -> vertical horizontal
 */
export function parseEdges(value: string | undefined, containerWidth: number = 0): EdgeSizes {
  if (!value || value === 'auto' || value === 'none') {
    return { top: 0, right: 0, bottom: 0, left: 0 };
  }

  const parts = value.trim().split(/\s+/);
  
  if (parts.length === 1) {
    const v = parseLength(parts[0], containerWidth);
    return { top: v, right: v, bottom: v, left: v };
  }
  
  if (parts.length === 2) {
    const vertical = parseLength(parts[0], containerWidth);
    const horizontal = parseLength(parts[1], containerWidth);
    return { top: vertical, right: horizontal, bottom: vertical, left: horizontal };
  }
  
  if (parts.length === 3) {
    const top = parseLength(parts[0], containerWidth);
    const horizontal = parseLength(parts[1], containerWidth);
    const bottom = parseLength(parts[2], containerWidth);
    return { top, right: horizontal, bottom, left: horizontal };
  }
  
  if (parts.length >= 4) {
    return {
      top: parseLength(parts[0], containerWidth),
      right: parseLength(parts[1], containerWidth),
      bottom: parseLength(parts[2], containerWidth),
      left: parseLength(parts[3], containerWidth),
    };
  }

  return { top: 0, right: 0, bottom: 0, left: 0 };
}
