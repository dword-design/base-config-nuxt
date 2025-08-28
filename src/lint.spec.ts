import pathLib from 'node:path';

import { Base } from '@dword-design/base';
import { expect, test } from '@playwright/test';
import endent from 'endent';
import fs from 'fs-extra';
import outputFiles from 'output-files';

import config from '.';

test('css error', async ({}, testInfo) => {
  const cwd = testInfo.outputPath();
  await fs.outputFile(pathLib.join(cwd, 'assets', 'style.scss'), 'foo bar\n');
  const base = new Base(config, { cwd });
  await base.prepare();
  await expect(base.lint({ stderr: 'pipe' })).rejects.toThrow('CssSyntaxError');
});

test('ignored', async ({}, testInfo) => {
  const cwd = testInfo.outputPath();
  const base = new Base(config, { cwd });
  await base.prepare();
  await fs.outputFile(pathLib.join(cwd, 'coverage', 'foo.scss'), 'foo bar\n');
  await base.lint();
});

test('linting error in ts file', async ({}, testInfo) => {
  const cwd = testInfo.outputPath();

  await outputFiles(cwd, {
    'model/foo.ts': 'const foo = 1',
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

  const base = new Base(config, { cwd });
  await base.prepare();

  await expect(base.lint()).rejects.toThrow(
    "'foo' is assigned a value but never used",
  );
});

test('linting error in vue file', async ({}, testInfo) => {
  const cwd = testInfo.outputPath();

  await fs.outputFile(
    pathLib.join(cwd, 'pages', 'index.vue'),
    endent`
      <script>
      foo bar
      </script>
    `,
  );

  const base = new Base(config, { cwd });
  await base.prepare();

  await expect(base.lint()).rejects.toThrow(
    'Parsing error: Unexpected keyword or identifier',
  );
});

test('unused translation', async ({}, testInfo) => {
  const cwd = testInfo.outputPath();

  await fs.outputFile(
    pathLib.join(cwd, 'i18n', 'de.json'),
    JSON.stringify({ foo: 'bar' }),
  );

  await fs.outputFile(
    pathLib.join(cwd, 'pages', 'index.vue'),
    endent`
      <template>
        <div />
      </template>
    `,
  );

  const base = new Base(config, { cwd });
  await base.prepare();

  await expect(base.lint()).rejects.toThrow(
    "1:2  error  unused 'foo' key  @intlify/vue-i18n/no-unused-keys",
  );
});
