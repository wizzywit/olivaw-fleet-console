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
  useKeyboardShortcut({ key: 'g' }, toggleView);
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
