'use client';

import { CommandMenu } from '@/shared/ui';
import type { useCommandPalette } from '../../use-cases/useCommandPalette';

export function CommandPalette({ palette }: { palette: ReturnType<typeof useCommandPalette> }) {
  return (
    <CommandMenu
      label="Command palette"
      placeholder="Find a robot, filter the fleet or run an action"
      isOpen={palette.isOpen}
      onOpenChange={palette.onOpenChange}
      inputValue={palette.query}
      onInputChange={palette.setQuery}
      sections={palette.sections}
      onAction={palette.runCommand}
      onTab={palette.searchFleet}
      emptyText="Nothing matches. Press Tab to search the fleet for it."
    />
  );
}
