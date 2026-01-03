import pathLib from 'node:path';

import { Base } from '@dword-design/base';
import { expect, test } from '@playwright/test';
import endent from 'endent';
import fs from 'fs-extra';

import config from '.';

test('fixable linting error', async ({}, testInfo) => {
  const cwd = testInfo.outputPath();

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
