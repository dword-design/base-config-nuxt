import pathLib from 'node:path';

import dotenv from '@dword-design/dotenv-json-extended';
import packageName from 'depcheck-package-name';
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

  const hasFiles = await execaCommand('tsc model --listFilesOnly', {
    cwd: this.cwd,
  })
    .then(() => true)
    .catch(() => false);

  if (hasFiles) {
    await execaCommand('tsc', {
      ...(options.log && { stdout: 'inherit' }),
      cwd: this.cwd,
      stderr: options.stderr,
    });

    await fs.outputFile(
      pathLib.join(this.cwd, 'babel.config.json'),
      `${JSON.stringify({
        plugins: [
          [
            packageName`babel-plugin-module-resolver`,
            { alias: { '@/model': './dist' } },
          ],
          packageName`babel-plugin-add-import-extension`,
        ],
      })}\n`,
    );

    try {
      await execaCommand('babel dist --out-dir dist', { cwd: this.cwd });
    } finally {
      await fs.remove(pathLib.join(this.cwd, 'babel.config.json'));
    }
  }

  return nuxt;
}
