'use client';

import type { StatusCounts } from '@olivaw/contracts';
import { robotStatusLabel, type RobotStatus } from '@/entities/robot';
import { formatCount } from '@/shared/lib';
import { ToggleChipGroup, type ToggleChip } from '@/shared/ui';
import { useFleetFilter } from '../../use-cases/useFleetFilter';

const statusChip = (id: RobotStatus) => ({ id, label: robotStatusLabel(id) });

const chips: { id: RobotStatus | 'all'; label: string; tone?: 'attention' }[] = [
  { id: 'all', label: 'All' },
  { ...statusChip('attention'), tone: 'attention' },
  statusChip('offline'),
  statusChip('working'),
  statusChip('charging'),
  statusChip('idle'),
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
