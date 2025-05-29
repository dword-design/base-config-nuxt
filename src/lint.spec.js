import pathLib from 'node:path';

import { Base } from '@dword-design/base';
import { expect, test } from '@playwright/test';
import fs from 'fs-extra';

test('css error', async ({}, testInfo) => {
  const cwd = testInfo.outputPath('');
  await fs.outputFile(pathLib.join(cwd, 'assets', 'style.scss'), 'foo bar\n');
  const base = new Base({ name: '../../src/index.js' }, { cwd });
  await base.prepare();
  await expect(base.lint()).rejects.toThrow('CssSyntaxError');
});

test('ignored', async ({}, testInfo) => {
  const cwd = testInfo.outputPath('');
  const base = new Base({ name: '../../src/index.js' }, { cwd });
  await base.prepare();
  await fs.outputFile(pathLib.join(cwd, 'coverage', 'foo.scss'), 'foo bar\n');
  await base.lint();
});
