import P from 'node:path';

import { Base } from '@dword-design/base';
import { expect, test } from '@playwright/test';
import endent from 'endent';
import { execaCommand } from 'execa';
import fs from 'fs-extra';
import outputFiles from 'output-files';

import config from '.';

test('cli', async ({}, testInfo) => {
  const cwd = testInfo.outputPath();

  await outputFiles(cwd, {
    model: {
      'cli.ts': endent`
        #!/usr/bin/env node

        import foo from './foo.ts'

        console.log(foo)
      `,
      'foo.ts': "export default 'foo'",
    },
  });

  const base = new Base(config, { cwd });
  await base.prepare();
  await base.run('build', { log: true });
  await fs.chmod(P.join(cwd, 'dist', 'cli.js'), '755');
  const { stdout } = await execaCommand('./dist/cli.js', { cwd });
  expect(stdout).toMatch(/^foo$/m);
});
