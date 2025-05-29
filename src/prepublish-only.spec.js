import pathLib from 'node:path';

import { Base } from '@dword-design/base';
import { endent } from '@dword-design/functions';
import { expect, test } from '@playwright/test';
import { execaCommand } from 'execa';
import fs from 'fs-extra';
import outputFiles from 'output-files';

import config from './index.js';

test('cli', async ({}, testInfo) => {
  const cwd = testInfo.outputPath('');

  await outputFiles(cwd, {
    model: {
      'cli.js': endent`
        #!/usr/bin/env node

        import foo from './foo.js'

        console.log(foo)
      `,
      'foo.js': "export default 'foo'",
    },
  });

  const base = new Base(config, { cwd });
  await base.prepare();
  await base.run('prepublishOnly');
  await fs.chmod(pathLib.join(cwd, 'dist', 'cli.js'), '755');
  const { stdout } = await execaCommand('./dist/cli.js', { cwd });
  expect(stdout).toMatch(/^foo$/m);
});

test('fixable linting error', async ({}, testInfo) => {
  const cwd = testInfo.outputPath('');

  await fs.outputFile(
    pathLib.join(cwd, 'pages', 'index.vue'),
    endent`
      <template>
        <div />
      </template>

      <script>
      export default {}
      </script>
    `,
  );

  const base = new Base(config, { cwd });
  await base.prepare();
  await base.run('prepublishOnly');

  expect(await fs.readFile(pathLib.join(cwd, 'pages', 'index.vue'), 'utf8'))
    .toEqual(endent`
      <template>
        <div />
      </template>

      <script>
      export default {};
      </script>

    `);
});

test('linting error in cli', async ({}, testInfo) => {
  const cwd = testInfo.outputPath('');

  await fs.outputFile(
    pathLib.join(cwd, 'model', 'cli.js'),
    endent`
      #!/usr/bin/env node

      const foo = 'bar'
    `,
  );

  const base = new Base(config, { cwd });
  await base.prepare();

  await expect(base.run('prepublishOnly')).rejects.toThrow(
    "'foo' is assigned a value but never used",
  );
});
