import { execaCommand, execa } from 'execa';
import { createRequire } from 'node:module';
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
    'eslint --fix .',
    ...(options.log ? [{ stdio: 'inherit' }] : []),
  );

  await execaCommand(
    'stylelint --fix --allow-empty-input --ignore-path .gitignore **/*.{css,scss,vue}',
    ...(options.log ? [{ stdio: 'inherit' }] : []),
  );
};
