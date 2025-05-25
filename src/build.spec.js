import P from 'node:path';

import { Base } from '@dword-design/base';
import { endent } from '@dword-design/functions';
import tester from '@dword-design/tester';
import testerPluginTmpDir from '@dword-design/tester-plugin-tmp-dir';
import { execaCommand } from 'execa';
import fs from 'fs-extra';
import outputFiles from 'output-files';

import self from './build.js';
import config from './index.js';

export default tester(
  {
    cli: async () => {
      await outputFiles({
        model: {
          'cli.js': endent`
            #!/usr/bin/env node

            import foo from './foo.js'

            console.log(foo)
          `,
          'foo.js': "export default 'foo'",
        },
      });

      await new Base(config).prepare();
      await self();
      await fs.chmod(P.join('dist', 'cli.js'), '755');
      const output = await execaCommand('./dist/cli.js', { all: true });
      expect(output.all).toMatch(/^foo$/m);
    },
  },
  [testerPluginTmpDir()],
);
