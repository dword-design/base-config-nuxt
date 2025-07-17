import type { CommandOptionsInput } from '@dword-design/base';
import dotenv from '@dword-design/dotenv-json-extended';
import { execaCommand } from 'execa';

import resolveAliases from './resolve-aliases';

export default async function (options: CommandOptionsInput) {
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

  await execaCommand(
    'mkdist --src=model --declaration --ext=js --pattern=** --pattern=!**/*.spec.ts --pattern=!**/*-snapshots',
    {
      ...(options.log && { stdout: 'inherit' }),
      cwd: this.cwd,
      stderr: options.stderr,
    },
  );

  await resolveAliases({ cwd: this.cwd });
  return nuxt;
}
