'use client';

import { Banner, Button } from '@/shared/ui';
import { useLiveConnectionBanner } from '../../use-cases/useLiveConnectionBanner';

export function LiveConnectionBanner() {
  const { isVisible, message, retry } = useLiveConnectionBanner();
  if (!isVisible) return null;
  return (
    <Banner
      tone="neutral"
      role="status"
      title="Live updates paused"
      action={
        <Button size="touch" onPress={retry}>
          Retry now
        </Button>
      }
    >
      {message}
    </Banner>
  );
}
