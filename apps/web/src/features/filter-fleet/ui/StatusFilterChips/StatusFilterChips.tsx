'use client';

import type { RobotStatus, StatusCounts } from '@olivaw/contracts';
import { formatCount } from '@/shared/lib';
import { ToggleChipGroup, type ToggleChip } from '@/shared/ui';
import { useFleetFilter } from '../../use-cases/useFleetFilter';

const chips: { id: RobotStatus | 'all'; label: string; tone?: 'attention' }[] = [
  { id: 'all', label: 'All' },
  { id: 'attention', label: 'Needs attention', tone: 'attention' },
  { id: 'offline', label: 'Offline' },
  { id: 'working', label: 'Working' },
  { id: 'charging', label: 'Charging' },
  { id: 'idle', label: 'Idle' },
];

export function StatusFilterChips({ counts, total }: { counts: StatusCounts; total: number }) {
  const { filter, setStatus } = useFleetFilter();
  const items: ToggleChip[] = chips.map((chip) => ({
    ...chip,
    count: formatCount(chip.id === 'all' ? total : counts[chip.id]),
  }));
  return (
    <ToggleChipGroup
      label="Filter by status"
      items={items}
      selectedId={filter.status}
      onChange={(id) => {
        const next = chips.find((chip) => chip.id === id);
        if (next !== undefined) setStatus(next.id);
      }}
    />
  );
}
