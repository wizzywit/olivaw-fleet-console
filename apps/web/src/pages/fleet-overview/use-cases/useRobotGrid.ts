'use client';

import { useMemo } from 'react';
import { hitTest, indexForId, layoutGrid, neighbour, type GridDirection } from '../services/gridLayout';
import { describeRobot } from '../services/robotDescription';
import type { RobotRowView } from './useFleetOverview';

export type { GridLayout } from '../services/gridLayout';

export const gridCellPx = 14;
const gridOptions = (width: number) => ({ width, cell: gridCellPx, gap: 3, labelHeight: 24 });

const keyDirections: Partial<Record<string, GridDirection>> = {
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowUp: 'up',
  ArrowDown: 'down',
  Home: 'home',
  End: 'end',
  j: 'right',
  k: 'left',
};

export function useRobotGrid(
  rows: RobotRowView[],
  sites: readonly { id: string; name: string }[],
  width: number,
) {
  const layout = useMemo(() => layoutGrid(rows, sites, gridOptions(width)), [rows, sites, width]);
  const rowById = useMemo(() => new Map(rows.map((row) => [row.id, row])), [rows]);
  const rowAt = (index: number) => {
    const cell = layout.cells[index];
    return cell === undefined ? undefined : rowById.get(cell.id);
  };
  return {
    layout,
    rowAt,
    directionFor: (key: string) => keyDirections[key],
    move: (index: number, direction: GridDirection) => neighbour(layout, index, direction),
    follow: (id: string | null, fallbackIndex: number) =>
      id === null ? Math.min(0, layout.cells.length - 1) : indexForId(layout, id, fallbackIndex),
    hit: (x: number, y: number) => hitTest(layout, x, y),
    describe: (index: number) => {
      const cell = layout.cells[index];
      const row = rowAt(index);
      const section = cell === undefined ? undefined : layout.sections[cell.sectionIndex];
      if (cell === undefined || row === undefined || section === undefined) return '';
      return describeRobot(
        row,
        `${section.name}, ${String(cell.indexInSection + 1)} of ${String(section.count)}`,
      );
    },
  };
}
