'use client';

import { SearchField } from '@/shared/ui';
import { useFleetFilter } from '../../use-cases/useFleetFilter';

export function FleetSearchField() {
  const { filter, setQuery } = useFleetFilter();
  return (
    <SearchField
      label="Search or filter robots"
      placeholder="Search, or filter: battery:<20 site:isar"
      value={filter.rawQuery}
      onChange={setQuery}
    />
  );
}
