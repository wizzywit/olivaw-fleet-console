'use client';

import { useSearchParams } from 'next/navigation';
import { readViewMode, replaceViewModeInUrl } from '../adapter/viewModeUrlAdapter';

export function useViewModeRepository() {
  const searchParams = useSearchParams();
  return {
    view: readViewMode(new URLSearchParams(searchParams?.toString() ?? '')),
    setView: replaceViewModeInUrl,
  };
}
