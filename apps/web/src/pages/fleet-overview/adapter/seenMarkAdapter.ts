import type { AttentionReason } from '@/entities/robot';
import { httpPostNoContent } from '@/shared/api';

export const markGroupSeen = (reason: AttentionReason, robotIds: readonly string[]): Promise<void> =>
  httpPostNoContent(`/api/attention-groups/${encodeURIComponent(reason)}/seen`, { robotIds });
