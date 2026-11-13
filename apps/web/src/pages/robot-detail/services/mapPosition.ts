const clampPercent = (value: number) => Math.min(100, Math.max(0, value));

export function toMapPercent(
  position: { x: number; y: number },
  map: { width: number; height: number },
): { left: number; top: number } {
  return {
    left: clampPercent((position.x / map.width) * 100),
    top: clampPercent((position.y / map.height) * 100),
  };
}
