import P from 'node:path';

import { Base } from '@dword-design/base';
import { endent } from '@dword-design/functions';
import { expect } from '@playwright/test';
import fs from 'fs-extra';
import nuxtDevReady from 'nuxt-dev-ready';
import outputFiles from 'output-files';
import { test } from 'playwright-local-tmp-dir';
import kill from 'tree-kill-promise';

import config from './index.js';

test('fixable linting error', async ({ page }) => {
  test.setTimeout(60_000);
  await fs.outputFile(
    'pages/index.vue',
    endent`
      <template>
        <div class="foo" />
      </template>

      <script>
      export default {}
      </script>\n
    `,
  );

  const base = new Base(config);
  await base.prepare();
  const nuxt = base.run('dev');

  try {
    await nuxtDevReady();
    await page.goto('http://localhost:3000');
    await expect(page.locator('.foo')).toBeAttached();

    await expect(async () => {
      expect(await fs.readFile(P.join('pages', 'index.vue'), 'utf8'))
        .toEqual(endent`
          <template>
            <div class="foo" />
          </template>

          <script>
          export default {};
          </script>\n
        `);
    }).toPass();
  } finally {
    await kill(nuxt.pid);
    await new Promise(resolve => setTimeout(resolve, 10_000));
  }
});

test('valid', async ({ page }) => {
  test.setTimeout(60_000);
  await outputFiles({
    'pages/index.vue': endent`
      <template>
        <div class="foo">Hello world</div>
      </template>
    `,
  });

  const base = new Base(config);
  await base.prepare();
  const nuxt = base.run('dev');

  try {
    await nuxtDevReady();
    await page.goto('http://localhost:3000');
    const foo = page.locator('.foo');
    await expect(foo).toBeAttached();
    expect(await foo.evaluate(el => el.textContent)).toEqual('Hello world');

    await fs.outputFile(
      P.join('pages', 'index.vue'),
      endent`
        <template>
          <div class="bar">Hello world</div>
        </template>
      `,
    );

    const bar = page.locator('.bar');
    await expect(bar).toBeAttached();
    expect(await bar.evaluate(el => el.textContent)).toEqual('Hello world');
  } finally {
    await kill(nuxt.pid);
    await new Promise(resolve => setTimeout(resolve, 10_000));
  }
});
