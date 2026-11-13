'use client';

import { useKeyboardShortcut } from '@/shared/lib';
import { useViewModeRepository } from '../repository/useViewModeRepository';
import type { ViewMode } from '../types/viewMode';

const isViewMode = (value: string): value is ViewMode => value === 'table' || value === 'grid';

export function useViewMode() {
  const { view, setView } = useViewModeRepository();
  const toggleView = () => {
    setView(view === 'grid' ? 'table' : 'grid');
  };
  return {
    view,
    options: [
      { id: 'table', label: 'Table' },
      { id: 'grid', label: 'Grid' },
    ],
    selectView: (id: string) => {
      if (isViewMode(id)) setView(id);
    },
    toggleView,
  };
}

// Registered once by the fleet page; the command palette also uses useViewMode and must not toggle a second time.
export function useViewModeShortcut(): void {
  const { toggleView } = useViewMode();
  useKeyboardShortcut({ key: 'g' }, toggleView);
}
