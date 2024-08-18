import { Base } from '@dword-design/base';
import { endent } from '@dword-design/functions';
import tester from '@dword-design/tester';
import testerPluginTmpDir from '@dword-design/tester-plugin-tmp-dir';
import fs from 'fs-extra';
import outputFiles from 'output-files';

import config from './index.js';
import self from './lint.js';

export default tester(
  {
    'css error': async () => {
      await outputFiles({
        'assets/style.scss': endent`
          foo bar

        `,
      });

      await new Base(config).prepare();
      await expect(self()).rejects.toThrow('CssSyntaxError');
    },
    ignored: async () => {
      await new Base(config).prepare();

      await fs.outputFile(
        'coverage/foo.scss',
        endent`
          foo bar

        `,
      );

      await self();
    },
  },
  [testerPluginTmpDir()],
);
