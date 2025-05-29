import { Base } from '@dword-design/base';
import { endent } from '@dword-design/functions';
import { expect, test } from '@playwright/test';
import fs from 'fs-extra';
import outputFiles from 'output-files';

import config from './index.js';

test('aliases', async ({}, testInfo) => {
  const cwd = testInfo.outputPath('');

  await outputFiles(cwd, {
    'model/foo.js': "export default 'bar'",
    'pages/index.vue': endent`
      <template>
        <div />
      </template>

      <script>
      import foo from '@/model/foo.js'

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

test('dependency inside vue file', async () => {
  await outputFiles({
    'node_modules/foo/index.js': '',
    'package.json': JSON.stringify({ dependencies: { foo: '^1.0.0' } }),
    'pages/index.vue': endent`
      <template>
        <div />
      </template>

      <script>
      import foo from 'foo'

      export default {
        computed: {
          foo: () => foo,
          bar: () => 1 |> (x => x * 2),
        },
      }
      </script>\n
    `,
  });

  const base = new Base(config);
  await base.prepare();
  await base.test();
});

test('external modules', async () => {
  await outputFiles({
    'config.js': endent`
      export default {
        modules: [
          'foo',
        ],
      };\n
    `,
    'node_modules/foo/index.js': 'export default () => {};',
    'package.json': JSON.stringify({ dependencies: { foo: '^1.0.0' } }),
  });

  const base = new Base(config);
  await base.prepare();
  await base.test();
});

test('linting error in js file', async () => {
  await outputFiles({
    'model/foo.js': 'const foo = 1',
    'pages/index.vue': endent`
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

  const base = new Base(config);
  await base.prepare();

  await expect(base.test()).rejects.toThrow(
    "'foo' is assigned a value but never used",
  );
});

test('linting error in vue file', async () => {
  await fs.outputFile(
    'pages/index.vue',
    endent`
      <script>
      foo bar
      </script>
    `,
  );

  const base = new Base(config);
  await base.prepare();

  await expect(base.test()).rejects.toThrow(
    'Parsing error: Missing semicolon. (2:3)',
  );
});

test('valid', async () => {
  await fs.outputFile(
    'pages/index.vue',
    endent`
      <template>
        <div>Hello world</div>
      </template>
    `,
  );

  const base = new Base(config);
  await base.prepare();
  await base.test();
});
