import { tooltipPlacement } from './tooltipPlacement';

const view = { width: 800, top: 0, height: 400 };

describe('tooltipPlacement', () => {
  it('opens below and to the right of the pointer by default', () => {
    expect(tooltipPlacement({ x: 100, y: 50 }, view)).toEqual({
      left: 112,
      top: 62,
      flipX: false,
      flipY: false,
    });
  });

  it('opens to the left in the right half, so it never leaves the view', () => {
    expect(tooltipPlacement({ x: 780, y: 50 }, view)).toMatchObject({ left: 768, flipX: true });
  });

  it('opens above near the bottom of the visible area, also when scrolled', () => {
    expect(tooltipPlacement({ x: 100, y: 380 }, view)).toMatchObject({ top: 368, flipY: true });
    expect(tooltipPlacement({ x: 100, y: 380 }, { ...view, top: 300 })).toMatchObject({ flipY: false });
  });
});
