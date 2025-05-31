import pathLib from 'node:path';

import { filter, first, map } from '@dword-design/functions';
import jitiBabelTransform from '@dword-design/jiti-babel-transform';
import { createJiti } from 'jiti';
import requirePackageName from 'require-package-name';

export default ({ cwd = '.' }) =>
  path => {
    if (pathLib.basename(path) === 'config.js') {
      // TODO: Check full path including cwd so that we check config.js at project root
      const jitiInstance = createJiti(pathLib.resolve(cwd), {
        esmResolve: true,
        interopDefault: true,
        transform: jitiBabelTransform,
      });

      const config = jitiInstance('./config.js');

      const modules = [
        ...(config.modules || []),
        ...(config.buildModules || []),
      ];

      return (
        modules
        |> map(mod => [mod].flat() |> first)
        |> filter(name => typeof name === 'string')
        |> map(name => requirePackageName(name))
      );
    }

    return [];
  };
