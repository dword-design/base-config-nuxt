import dotenv from '@dword-design/dotenv-json-extended';
import { execaCommand } from 'execa';

export default async function (options) {
  options = {
    env: {},
    log: process.env.NODE_ENV !== 'test',
    stderr: 'inherit',
    ...options,
  };

  await execaCommand('nuxi prepare', {
    ...(options.log && { stdout: 'inherit' }),
    cwd: this.cwd,
    env: { ...dotenv.parse({ cwd: this.cwd }), ...options.env },
    stderr: options.stderr,
  });

  await execaCommand(
    'stylelint --fix --allow-empty-input --ignore-path .gitignore **/*.{css,scss,vue}', {
    ...(options.log && { stdout: 'inherit' }),
    cwd: this.cwd,
    env: { ...dotenv.parse({ cwd: this.cwd }), ...options.env },
    stderr: options.stderr,
  });
}
