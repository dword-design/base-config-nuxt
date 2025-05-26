import { createRequire } from 'node:module';

import { execa, execaCommand } from 'execa';

const resolver = createRequire(import.meta.url);
const nuxtWrapper = resolver.resolve('./nuxt-wrapper.js');

export default async (options = {}) => {
  options = { log: process.env.NODE_ENV !== 'test', ...options };

  await execa(
    nuxtWrapper,
    ['prepare'],
    ...(options.log ? [{ stdio: 'inherit' }] : []),
  );

  await execaCommand(
    'stylelint --fix --allow-empty-input --ignore-path .gitignore **/*.{css,scss,vue}',
    ...(options.log ? [{ stdio: 'inherit' }] : []),
  );
};
