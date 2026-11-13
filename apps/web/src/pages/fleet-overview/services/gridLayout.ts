export interface GridCell {
  id: string;
  index: number;
  x: number;
  y: number;
  column: number;
  sectionIndex: number;
  indexInSection: number;
}

export interface GridSection {
  siteId: string;
  name: string;
  y: number;
  count: number;
}

export interface GridLayout {
  cells: GridCell[];
  sections: GridSection[];
  columns: number;
  cell: number;
  gap: number;
  width: number;
  height: number;
  // Cell indexes per visual row, top to bottom, for up and down movement.
  rows: number[][];
}

export interface GridOptions {
  width: number;
  cell: number;
  gap: number;
  labelHeight: number;
}

export type GridDirection = 'left' | 'right' | 'up' | 'down' | 'home' | 'end';

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

// Robots are grouped by site in site order (unknown sites last) and keep the list order inside each site, so the grid
// shows the same held order as the table.
export function layoutGrid(
  rows: readonly { id: string; siteId: string }[],
  sites: readonly { id: string; name: string }[],
  { width, cell, gap, labelHeight }: GridOptions,
): GridLayout {
  const columns = Math.max(1, Math.floor((width + gap) / (cell + gap)));
  const bySite = new Map<string, string[]>();
  for (const row of rows) bySite.set(row.siteId, [...(bySite.get(row.siteId) ?? []), row.id]);
  const knownIds = sites.map((site) => site.id);
  const order = [
    ...knownIds.filter((id) => bySite.has(id)),
    ...[...bySite.keys()].filter((id) => !knownIds.includes(id)),
  ];

  const cells: GridCell[] = [];
  const sections: GridSection[] = [];
  const visualRows: number[][] = [];
  let top = 0;
  order.forEach((siteId, sectionIndex) => {
    const ids = bySite.get(siteId) ?? [];
    sections.push({
      siteId,
      name: sites.find((site) => site.id === siteId)?.name ?? siteId,
      y: top,
      count: ids.length,
    });
    const cellsTop = top + labelHeight;
    ids.forEach((id, indexInSection) => {
      const column = indexInSection % columns;
      const row = Math.floor(indexInSection / columns);
      const index = cells.length;
      if (column === 0) visualRows.push([]);
      visualRows.at(-1)?.push(index);
      cells.push({
        id,
        index,
        x: column * (cell + gap),
        y: cellsTop + row * (cell + gap),
        column,
        sectionIndex,
        indexInSection,
      });
    });
    top = cellsTop + Math.ceil(ids.length / columns) * (cell + gap) + gap;
  });
  return {
    cells,
    sections,
    columns,
    cell,
    gap,
    width: columns * (cell + gap) - gap,
    height: Math.max(0, top - gap),
    rows: visualRows,
  };
}

export function neighbour(layout: GridLayout, index: number, direction: GridDirection): number {
  const last = layout.cells.length - 1;
  if (direction === 'home') return 0;
  if (direction === 'end') return last;
  if (direction === 'left' || direction === 'right')
    return clamp(index + (direction === 'left' ? -1 : 1), 0, last);
  const rowIndex = layout.rows.findIndex((row) => row.includes(index));
  const target =
    layout.rows[clamp(rowIndex + (direction === 'up' ? -1 : 1), 0, layout.rows.length - 1)] ?? [];
  const column = layout.cells[index]?.column ?? 0;
  return target.find((candidate) => layout.cells[candidate]?.column === column) ?? target.at(-1) ?? index;
}

export function indexForId(layout: GridLayout, id: string, fallbackIndex: number): number {
  if (layout.cells.length === 0) return -1;
  return (
    layout.cells.find((cell) => cell.id === id)?.index ?? clamp(fallbackIndex, 0, layout.cells.length - 1)
  );
}

export function hitTest(layout: GridLayout, x: number, y: number): number | null {
  const hit = layout.cells.find(
    (cell) => x >= cell.x && x < cell.x + layout.cell && y >= cell.y && y < cell.y + layout.cell,
  );
  return hit?.index ?? null;
}
