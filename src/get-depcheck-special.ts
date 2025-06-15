import pathLib from 'node:path';

import { createJiti } from 'jiti';
import requirePackageName from 'require-package-name';

export default ({ cwd = '.' }) =>
  async path => {
    if (pathLib.basename(path) === 'config.ts') {
      // TODO: Check full path including cwd so that we check config.ts at project root
      const jiti = createJiti(pathLib.resolve(cwd));
      const config = await jiti.import('./config.ts', { default: true });

      const modules = [
        ...(config.modules || []),
        ...(config.buildModules || []),
      ];

      return modules
        .map(mod => [mod].flat()[0])
        .filter(name => typeof name === 'string')
        .map(name => requirePackageName(name));
    }

    return [];
  };
