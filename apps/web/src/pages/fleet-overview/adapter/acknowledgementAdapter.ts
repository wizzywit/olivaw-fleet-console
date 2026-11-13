import type { AttentionReason } from '@/entities/robot';
import { httpPostNoContent } from '@/shared/api';

export const acknowledgeGroup = (reason: AttentionReason, robotIds: readonly string[]): Promise<void> =>
  httpPostNoContent(`/api/attention-groups/${encodeURIComponent(reason)}/acknowledge`, { robotIds });
