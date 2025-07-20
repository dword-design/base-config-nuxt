import pathLib from 'node:path';

import { Base } from '@dword-design/base';
import { test } from '@playwright/test';
import endent from 'endent';
import fs from 'fs-extra';
import outputFiles from 'output-files';

import config from '.';

test('aliases', async ({}, testInfo) => {
  const cwd = testInfo.outputPath();

  await outputFiles(cwd, {
    'model/foo.ts': "export default 'bar'",
    'pages/index.vue': endent`
      <template>
        <div />
      </template>

      <script>
      import foo from '@/model/foo'

      export default {
        computed: {
          foo: () => foo,
        },
      }
      </script>\n
    `,
  });

  const base = new Base(config, { cwd });
  await base.prepare();
  await base.test();
});

test('external modules', async ({}, testInfo) => {
  const cwd = testInfo.outputPath();

  await outputFiles(cwd, {
    'config.ts': endent`
      export default {
        modules: [
          'foo',
        ],
      };\n
    `,
    'node_modules/foo/index.js': 'export default () => {};',
    'package.json': JSON.stringify({ dependencies: { foo: '^1.0.0' } }),
  });

  const base = new Base(config, { cwd });
  await base.prepare();
  await base.test();
});

test('valid', async ({}, testInfo) => {
  const cwd = testInfo.outputPath();

  await fs.outputFile(
    pathLib.join(cwd, 'pages', 'index.vue'),
    endent`
      <template>
        <div>Hello world</div>
      </template>
    `,
  );

  const base = new Base(config, { cwd });
  await base.prepare();
  await base.test();
});
