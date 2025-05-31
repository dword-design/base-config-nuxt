import pathLib from 'node:path';

import dotenv from '@dword-design/dotenv-json-extended';
import { execaCommand } from 'execa';
import fs from 'fs-extra';

export default async function (options) {
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

  if (await fs.exists(pathLib.join(this.cwd, 'model'))) {
    await fs.remove(pathLib.join(this.cwd, 'dist'));

    await execaCommand(
      'babel --out-dir dist --copy-files --no-copy-ignored --ignore **/*.spec.js model',
      {
        ...(options.log && { stdout: 'inherit' }),
        cwd: this.cwd,
        env: options.env,
        stderr: options.stderr,
      },
    );
  }

  return nuxt;
}
