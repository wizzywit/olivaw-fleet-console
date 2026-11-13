import fsd from '@feature-sliced/steiger-plugin';
import { defineConfig } from 'steiger';

export default defineConfig([
  ...fsd.configs.recommended,
  {
    // ARCHITECTURE.md names segments after the five layers (use-cases, repository, services, adapter, types);
    // Steiger only knows FSD's ui/api/lib/model/config, so these two rules would contradict the architecture.
    // eslint-plugin-boundaries enforces the segment and slice rules instead (eslint.config.mjs).
    rules: {
      'fsd/segments-by-purpose': 'off',
      'fsd/no-segmentless-slices': 'off',
    },
  },
]);
