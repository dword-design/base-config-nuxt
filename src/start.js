import { execaCommand } from 'execa';

export default function (options) {
  options = {
    env: {},
    log: process.env.NODE_ENV !== 'test',
    stderr: 'inherit',
    ...options,
  };

  return execaCommand('node .output/server/index.mjs', {
    ...(options.log && { stdout: 'inherit' }),
    cwd: this.cwd,
    env: options.env,
    reject: process.env.NODE_ENV !== 'test',
    stderr: options.stderr,
  });
}
