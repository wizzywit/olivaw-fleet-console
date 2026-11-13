import { replaceSearchParams } from '@/shared/lib';
import type { ViewMode } from '../types/viewMode';

export const readViewMode = (params: URLSearchParams): ViewMode =>
  params.get('view') === 'grid' ? 'grid' : 'table';

export function replaceViewModeInUrl(view: ViewMode): void {
  replaceSearchParams(['view'], new URLSearchParams(view === 'grid' ? { view } : {}));
}
