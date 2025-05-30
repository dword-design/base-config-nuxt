import { Base } from '@dword-design/base';
import { endent } from '@dword-design/functions';
import { expect, test } from '@playwright/test';
import getPort from 'get-port';
import outputFiles from 'output-files';
import portReady from 'port-ready';

import config from './index.js';
import killAndWait from './kill-and-wait.js';

const tests = {
  valid: {
    files: {
      'pages/index.vue': endent`
        <template>
          <div class="foo">Hello world</div>
        </template>\n
      `,
    },
    test: async ({ page }) =>
      expect(
        await page.locator('.foo').evaluate(div => div.textContent),
      ).toEqual('Hello world'),
  },
};

for (const [name, testConfig] of Object.entries(tests)) {
  test(name, async ({ page }, testInfo) => {
    const cwd = testInfo.outputPath('');
    await outputFiles(cwd, testConfig.files);
    const base = new Base(config, { cwd });
    await base.prepare();
    const port = await getPort();
    await base.run('prepublishOnly', { env: { PORT: port } });
    const nuxt = base.run('start', { env: { PORT: port } });

    try {
      await portReady(port);
      await page.goto(`http://localhost:${port}`);
      await testConfig.test({ page });
    } finally {
      await killAndWait(nuxt, port);
    }
  });
}
