import { execa } from 'execa';
import fs from 'fs-extra';
import { createRequire } from 'module';

import lint from './lint.js';

const _require = createRequire(import.meta.url);
const nuxtWrapper = _require.resolve('./nuxt-wrapper.js');

export default async (options = {}) => {
  options = { log: process.env.NODE_ENV !== 'test', ...options };
  await lint({ log: options.log });

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
