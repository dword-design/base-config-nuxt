import { createRequire } from 'node:module';
import pathLib from 'node:path';

import { execa } from 'execa';
import fs from 'fs-extra';

const resolver = createRequire(import.meta.url);
const nuxtWrapper = resolver.resolve('./nuxt-wrapper.js');

export default async function (options = {}) {
  options = {
    log: process.env.NODE_ENV !== 'test',
    stderr: 'inherit',
    ...options,
  };

  const nuxt = await execa(nuxtWrapper, ['build'], {
    ...(options.log && { stdout: 'inherit' }),
    stderr: options.stderr,
    ...(process.env.NODE_ENV === 'test'
      ? { env: { NUXT_TELEMETRY_DISABLED: 1 } }
      : {}),
    cwd: this.cwd,
  });

  if (await fs.exists(pathLib.join(this.cwd, 'model'))) {
    await fs.remove(pathLib.join(this.cwd, 'dist'));

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
      {
        ...(options.log && { stdout: 'inherit' }),
        cwd: this.cwd,
        stderr: options.stderr,
      },
    );
  }

  return nuxt;
}
