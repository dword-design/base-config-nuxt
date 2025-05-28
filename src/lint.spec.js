import { Base } from '@dword-design/base';
import { expect } from '@playwright/test';
import fs from 'fs-extra';
import { test } from 'playwright-local-tmp-dir';

import self from './lint.js';

test('css error', async () => {
  await fs.outputFile('assets/style.scss', 'foo bar\n');
  await new Base({ name: '../src/index.js' }).prepare();
  await expect(self()).rejects.toThrow('CssSyntaxError');
});

test('ignored', async () => {
  await new Base({ name: '../src/index.js' }).prepare();
  await fs.outputFile('coverage/foo.scss', 'foo bar\n');
  await self();
});
