import pathLib from 'node:path';

import { Base } from '@dword-design/base';
import { endent } from '@dword-design/functions';
import { expect, test } from '@playwright/test';
import fs from 'fs-extra';
import getPort from 'get-port';
import nuxtDevReady from 'nuxt-dev-ready';
import kill from 'tree-kill-promise';

import config from './index.js';

test('fixable linting error', async ({ page }, testInfo) => {
  const cwd = testInfo.outputPath();

  await fs.outputFile(
    pathLib.join(cwd, 'pages', 'index.vue'),
    endent`
      <template>
        <div class="foo" />
      </template>

      <script>
      export default {}
      </script>\n
    `,
  );

  const base = new Base(config, { cwd });
  await base.prepare();
  const port = await getPort();
  const nuxt = base.run('dev', { env: { PORT: port } });

  try {
    await nuxtDevReady(port);
    await page.goto(`http://localhost:${port}`);
    await expect(page.locator('.foo')).toBeAttached();

    await expect(async () => {
      expect(await fs.readFile(pathLib.join(cwd, 'pages', 'index.vue'), 'utf8'))
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
  }
});

// TODO: Implement that test and make it robust (detect when the HMR is ready)
/*test('valid', async ({ page }, testInfo) => {
  const cwd = testInfo.outputPath();

  await outputFiles(cwd, {
    'pages/index.vue': endent`
      <template>
        <div class="foo">Hello world</div>
      </template>
    `,
  });

  const base = new Base(config, { cwd });
  await base.prepare();
  const port = await getPort();
  const nuxt = base.run('dev', { env: { PORT: port } });

  try {
    await nuxtDevReady(port);
    await page.goto(`http://localhost:${port}`);
    await expect(page.locator('.foo')).toHaveText('Hello world');
    await delay(10_000); // TODO: Replace this by detecting if HMR is ready

    await fs.outputFile(
      pathLib.join(cwd, 'pages', 'index.vue'),
      endent`
        <template>
          <div class="bar">Hello world</div>
        </template>
      `,
    );

    await delay(10_000);
    const bar = page.locator('.bar');
    await expect(bar).toBeAttached({ timeout: 10_000 });
    await expect(bar).toHaveText('Hello world');
  } finally {
    await kill(nuxt.pid);
  }
});*/
