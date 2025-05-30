import { createRequire } from 'node:module';

import { execa } from 'execa';

const resolver = createRequire(import.meta.url);
const nuxtWrapper = resolver.resolve('./nuxt-wrapper.js');

export default async function (options) {
  options = {
    env: {},
    log: process.env.NODE_ENV !== 'test',
    stderr: 'inherit',
    ...options,
  };

  await execa(nuxtWrapper, ['prepare'], {
    ...(options.log && { stdout: 'inherit' }),
    cwd: this.cwd,
    env: options.env,
    stderr: options.stderr,
  });
}
