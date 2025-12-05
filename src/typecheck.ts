import type { Base, PartialCommandOptions } from '@dword-design/base';
import dotenv from '@dword-design/dotenv-json-extended';
import { execaCommand } from 'execa';

export default async function (
  this: Base,
  options: PartialCommandOptions = {},
) {
  options = {
    log: process.env.NODE_ENV !== 'test',
    stderr: 'inherit',
    ...options,
  };

  await execaCommand('nuxi prepare', {
    ...(options.log && { stdout: 'inherit' }),
    cwd: this.cwd,
    env: dotenv.parse({ cwd: this.cwd }),
    stderr: options.stderr,
  });
}
