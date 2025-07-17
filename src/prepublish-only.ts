import type { CommandOptionsInput } from '@dword-design/base';

export default async function (options: CommandOptionsInput) {
  await this.lint(options);
  return this.run('build', options);
}
