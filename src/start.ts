import type { CommandOptionsInput } from '@dword-design/base';
import dotenv from '@dword-design/dotenv-json-extended';
import { execaCommand } from 'execa';

export default function (options: CommandOptionsInput) {
  options = {
    env: {},
    log: process.env.NODE_ENV !== 'test',
    stderr: 'inherit',
    ...options,
  };

  return execaCommand('nuxt start', {
    ...(options.log && { stdout: 'inherit' }),
    cwd: this.cwd,
    env: { ...dotenv.parse({ cwd: this.cwd }), ...options.env },
    reject: process.env.NODE_ENV !== 'test',
    stderr: options.stderr,
  });
}
