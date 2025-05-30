import { createRequire } from 'node:module';

import { execa } from 'execa';

const resolver = createRequire(import.meta.url);
const nuxtWrapper = resolver.resolve('./nuxt-wrapper.js');

export default function (options) {
  options = {
    env: {},
    log: process.env.NODE_ENV !== 'test',
    stderr: 'inherit',
    ...options,
  };

  return execa(nuxtWrapper, ['dev'], {
    ...(options.log && { stdout: 'inherit' }),
    cwd: this.cwd,
    env: options.env,
    stderr: options.stderr,
  });
}
