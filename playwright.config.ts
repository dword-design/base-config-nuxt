import { defineConfig } from '@playwright/test';

export default defineConfig({
  preserveOutput: 'failures-only',

  snapshotPathTemplate:
    '{snapshotDir}/{testFileDir}/{testFileName}-snapshots/{arg}{-projectName}{ext}',

  timeout: 100_000,
  //fullyParallel: true,
  workers: 1,
  retries: 2, // TODO: Get rid of retries
});
