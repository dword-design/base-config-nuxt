import { createRequire } from 'node:module';

import { execa } from 'execa';

const resolver = createRequire(import.meta.url);
const nuxtWrapper = resolver.resolve('./nuxt-wrapper.js');

export default (options = {}) => {
  options = { log: process.env.NODE_ENV !== 'test', ...options };
  return execa(nuxtWrapper, ['dev', '--no-fork'], {
    [options.log ? 'stdio' : 'stderr']: 'inherit',
    reject: false,
  });
};
