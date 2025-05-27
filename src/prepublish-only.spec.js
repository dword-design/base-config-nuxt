import P from 'node:path';

import { Base } from '@dword-design/base';
import { endent } from '@dword-design/functions';
import tester from '@dword-design/tester';
import testerPluginTmpDir from '@dword-design/tester-plugin-tmp-dir';
import { execaCommand } from 'execa';
import fs from 'fs-extra';
import outputFiles from 'output-files';

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

      const base = new Base(config);
      await base.prepare();
      await base.run('prepublishOnly');
      await fs.chmod(P.join('dist', 'cli.js'), '755');
      const output = await execaCommand('./dist/cli.js', { all: true });
      expect(output.all).toMatch(/^foo$/m);
    },
    'fixable linting error': async () => {
      await fs.outputFile(
        'pages/index.vue',
        endent`
          <template>
            <div />
          </template>

          <script>
          export default {}
          </script>
        `,
      );

      const base = new Base(config);
      await base.prepare();
      await base.run('prepublishOnly');

      expect(await fs.readFile(P.join('pages', 'index.vue'), 'utf8'))
        .toEqual(endent`
          <template>
            <div />
          </template>

          <script>
          export default {};
          </script>

        `);
    },
    'linting error in cli': async () => {
      await fs.outputFile(
        'model/cli.js',
        endent`
          #!/usr/bin/env node

          const foo = 'bar'
        `,
      );

      const base = new Base(config);
      await base.prepare();
      let output;

      try {
        await base.run('prepublishOnly');
      } catch (error) {
        output = error.message;
      }

      expect(output).toMatch("'foo' is assigned a value but never used");
    },
  },
  [testerPluginTmpDir()],
);
