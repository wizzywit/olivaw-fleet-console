import { hitTest, indexForId, layoutGrid, neighbour } from './gridLayout';

const sites = [
  { id: 'airport', name: 'Airport' },
  { id: 'hotel', name: 'Hotel' },
];
const options = { width: 100, cell: 20, gap: 5, labelHeight: 10 };
// 100 px fit four 20 px cells with 5 px gaps.
const rows = [
  ...['A1', 'A2', 'A3', 'A4', 'A5', 'A6'].map((id) => ({ id, siteId: 'airport' })),
  ...['H1', 'H2'].map((id) => ({ id, siteId: 'hotel' })),
];

describe('layoutGrid', () => {
  it('groups cells by site in site order, keeps row order and wraps at the width', () => {
    const layout = layoutGrid(
      [rows[6], ...rows.slice(0, 6), rows[7]].filter((row) => row !== undefined),
      sites,
      options,
    );
    expect(layout.columns).toBe(4);
    expect(layout.sections.map((section) => [section.name, section.count])).toEqual([
      ['Airport', 6],
      ['Hotel', 2],
    ]);
    expect(layout.cells.map((cell) => cell.id)).toEqual(['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'H1', 'H2']);
    const a5 = layout.cells[4];
    expect([a5?.x, a5?.y, a5?.column]).toEqual([0, 10 + 25, 0]);
    expect(layout.cells[6]?.y).toBeGreaterThan(layout.cells[5]?.y ?? 0);
    expect(layout.cells[6]).toMatchObject({ indexInSection: 0, sectionIndex: 1 });
  });

  it('leaves out sites without robots and puts unknown sites last', () => {
    const layout = layoutGrid(
      [
        { id: 'X1', siteId: 'mars' },
        { id: 'H1', siteId: 'hotel' },
      ],
      sites,
      options,
    );
    expect(layout.sections.map((section) => section.name)).toEqual(['Hotel', 'mars']);
  });
});

describe('neighbour', () => {
  const layout = layoutGrid(rows, sites, options);
  const at = (index: number) => layout.cells[index]?.id;

  it('moves left and right through the order and stops at the edges', () => {
    expect(at(neighbour(layout, 3, 'right'))).toBe('A5');
    expect(at(neighbour(layout, 0, 'left'))).toBe('A1');
    expect(at(neighbour(layout, 7, 'right'))).toBe('H2');
  });

  it('keeps the column moving up and down, and lands on the last cell of a shorter row', () => {
    expect(at(neighbour(layout, 1, 'down'))).toBe('A6');
    expect(at(neighbour(layout, 2, 'down'))).toBe('A6');
    expect(at(neighbour(layout, 5, 'up'))).toBe('A2');
  });

  it('crosses from one site to the next', () => {
    expect(at(neighbour(layout, 4, 'down'))).toBe('H1');
    expect(at(neighbour(layout, 6, 'up'))).toBe('A5');
  });

  it('jumps to the first and last robot', () => {
    expect(at(neighbour(layout, 4, 'home'))).toBe('A1');
    expect(at(neighbour(layout, 0, 'end'))).toBe('H2');
  });
});

describe('indexForId', () => {
  it('follows the focused robot after a reorder, or keeps the nearest place when it is gone', () => {
    const reordered = layoutGrid([...rows].reverse(), sites, options);
    expect(indexForId(reordered, 'A6', 0)).toBe(0);
    expect(indexForId(reordered, 'GONE', 99)).toBe(7);
    expect(indexForId(layoutGrid([], sites, options), 'A1', 3)).toBe(-1);
  });
});

describe('hitTest', () => {
  const layout = layoutGrid(rows, sites, options);

  it('finds the cell under the pointer and nothing in gaps or labels', () => {
    expect(hitTest(layout, 30, 15)).toBe(1);
    expect(hitTest(layout, 22, 15)).toBeNull();
    expect(hitTest(layout, 5, 2)).toBeNull();
  });
});
