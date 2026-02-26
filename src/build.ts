import type { Base, PartialCommandOptions } from '@dword-design/base';
import dotenv from '@dword-design/dotenv-json-extended';
import { execaCommand } from 'execa';

export default async function (
  this: Base,
  options: PartialCommandOptions = {},
) {
  options = {
    env: {},
    log: process.env.NODE_ENV !== 'test',
    stderr: 'inherit',
    ...options,
  };

  const nuxt = await execaCommand('nuxt build', {
    ...(options.log && { stdout: 'inherit' }),
    stderr: options.stderr,
    ...(process.env.NODE_ENV === 'test'
      ? { env: { NUXT_TELEMETRY_DISABLED: 1 } }
      : {}),
    cwd: this.cwd,
    env: { ...dotenv.parse({ cwd: this.cwd }), ...options.env },
  });

  return nuxt;
}
