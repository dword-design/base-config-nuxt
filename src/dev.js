import { createRequire } from 'node:module';

import { x } from 'tinyexec';

const _require = createRequire(import.meta.url);
const nuxtWrapper = _require.resolve('./nuxt-wrapper.js');

export default (options = {}) => {
  options = { log: process.env.NODE_ENV !== 'test', ...options };
  return x(nuxtWrapper, ['dev'], {
    nodeOptions: { [options.log ? 'stdio' : 'stderr']: 'inherit' },
  });
};
