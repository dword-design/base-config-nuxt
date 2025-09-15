import pathLib from 'node:path';

import { createJiti } from 'jiti';
import type { NuxtConfig } from 'nuxt/schema';
import requirePackageName from 'require-package-name';

export default ({ cwd = '.' }) =>
  async (path: string) => {
    if (pathLib.basename(path) === 'config.ts') {
      // TODO: Check full path including cwd so that we check config.ts at project root
      const jiti = createJiti(pathLib.resolve(cwd));

      const config: NuxtConfig = await jiti.import('./config.ts', {
        default: true,
      });

      const modules = config.modules || [];
      return modules
        .map(mod => [mod].flat()[0])
        .filter(name => typeof name === 'string')
        .map(name => requirePackageName(name)!);
    }

    return [];
  };
