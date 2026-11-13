export interface TooltipPlacement {
  left: number;
  top: number;
  flipX: boolean;
  flipY: boolean;
}

const offset = 12;
const roomBelow = 48;

// Opens away from the nearest edge of the visible area, so the scroll box never clips the tooltip.
export function tooltipPlacement(
  point: { x: number; y: number },
  view: { width: number; top: number; height: number },
): TooltipPlacement {
  const flipX = point.x > view.width / 2;
  const flipY = point.y - view.top > view.height - roomBelow;
  return {
    left: point.x + (flipX ? -offset : offset),
    top: point.y + (flipY ? -offset : offset),
    flipX,
    flipY,
  };
}
