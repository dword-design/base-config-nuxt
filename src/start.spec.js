import { Base } from '@dword-design/base';
import { endent } from '@dword-design/functions';
import { expect, test } from '@playwright/test';
import getPort from 'get-port';
import outputFiles from 'output-files';
import pWaitFor from 'p-wait-for';
import portReady from 'port-ready';

import config from './index.js';
import isPortFree from './is-port-free.js';

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
    await base.run('prepublishOnly');
    const nuxt = base.run('start', { env: { PORT: port } });
    await portReady(port);
    await page.goto(`http://localhost:${port}`);
    await testConfig.test({ page });
    nuxt.kill('SIGINT');
    await pWaitFor(() => isPortFree(port));
  });
}
