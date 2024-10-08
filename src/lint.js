import { execaCommand } from 'execa';

export default async (options = {}) => {
  options = { log: process.env.NODE_ENV !== 'test', ...options };

  await execaCommand(
    'eslint --fix --ignore-path .gitignore --ext .js,.json,.vue .',
    ...(options.log ? [{ stdio: 'inherit' }] : []),
  );

  await execaCommand(
    'stylelint --fix --allow-empty-input --ignore-path .gitignore **/*.{css,scss,vue}',
    ...(options.log ? [{ stdio: 'inherit' }] : []),
  );
};
