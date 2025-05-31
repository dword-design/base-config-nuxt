import { Base } from '@dword-design/base';
import { endent } from '@dword-design/functions';
import { expect, test } from '@playwright/test';
import getPort from 'get-port';
import outputFiles from 'output-files';
import portReady from 'port-ready';

import config from './index.js';
import killAndWait from './kill-and-wait.js';

test('valid', async ({ page }, testInfo) => {
  const cwd = testInfo.outputPath();

  await outputFiles(cwd, {
    'pages/index.vue': endent`
      <template>
        <div class="foo">Hello world</div>
      </template>\n
    `,
  });

  const base = new Base(config, { cwd });
  await base.prepare();
  const port = await getPort();
  await base.run('prepublishOnly');
  const nuxt = base.run('start', { env: { PORT: port } });

  try {
    await portReady(port);
    await page.goto(`http://localhost:${port}`);
    await expect(page.locator('.foo')).toHaveText('Hello world');
  } finally {
    await killAndWait(nuxt, port);
  }
});
