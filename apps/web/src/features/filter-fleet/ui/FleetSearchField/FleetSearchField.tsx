'use client';

import { SearchField, type SearchFieldProps } from '@/shared/ui';
import { useFleetFilter } from '../../use-cases/useFleetFilter';

export function FleetSearchField({ shortcut }: Pick<SearchFieldProps, 'shortcut'>) {
  const { filter, setQuery } = useFleetFilter();
  return (
    <SearchField
      label="Search or filter robots"
      placeholder="Search, or filter: battery:<20 site:isar"
      value={filter.rawQuery}
      onChange={setQuery}
      {...(shortcut === undefined ? {} : { shortcut })}
    />
  );
}
