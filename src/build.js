import { createRequire } from 'node:module';

import { execa } from 'execa';
import fs from 'fs-extra';

const resolver = createRequire(import.meta.url);
const nuxtWrapper = resolver.resolve('./nuxt-wrapper.js');

export default async (options = {}) => {
  options = { log: process.env.NODE_ENV !== 'test', ...options };

  const nuxt = await execa(nuxtWrapper, ['build'], {
    ...(options.log ? { stdio: 'inherit' } : {}),
    ...(process.env.NODE_ENV === 'test'
      ? { env: { NUXT_TELEMETRY_DISABLED: 1 } }
      : {}),
  });

  if (await fs.exists('model')) {
    await fs.remove('dist');

    await execa(
      'babel',
      [
        '--out-dir',
        'dist',
        '--copy-files',
        '--no-copy-ignored',
        '--ignore',
        '**/*.spec.js',
        'model',
      ],
      ...(options.log ? [{ stdio: 'inherit' }] : []),
    );
  }

  return nuxt;
};
