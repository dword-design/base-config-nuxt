import P from 'node:path';

import { filter, first, map } from '@dword-design/functions';
import jitiBabelTransform from '@dword-design/jiti-babel-transform';
import { createJiti } from 'jiti';
import requirePackageName from 'require-package-name';

export default path => {
  if (P.basename(path) === 'config.js') {
    const jitiInstance = createJiti(process.cwd(), {
      esmResolve: true,
      interopDefault: true,
      transform: jitiBabelTransform,
    });

    const config = jitiInstance('./config.js');
    const modules = [...(config.modules || []), ...(config.buildModules || [])];
    return (
      modules
      |> map(mod => [mod].flat() |> first)
      |> filter(name => typeof name === 'string')
      |> map(name => requirePackageName(name))
    );
  }

  return [];
};
