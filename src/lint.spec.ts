import pathLib from 'node:path';

import { Base } from '@dword-design/base';
import { expect, test } from '@playwright/test';
import endent from 'endent';
import fs from 'fs-extra';

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

  await fs.outputFile(
    pathLib.join(cwd, 'server/utils/foo.ts'),
    'const foo = 1\n',
  );

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
