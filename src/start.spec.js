import { Base } from '@dword-design/base';
import { endent } from '@dword-design/functions';
import { expect, test } from '@playwright/test';
import outputFiles from 'output-files';
import portReady from 'port-ready';
import kill from 'tree-kill-promise';

import config from './index.js';

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
    await base.run('prepublishOnly');
    const nuxt = base.run('start');
    await portReady(3000);
    await page.goto('http://localhost:3000');
    await testConfig.test({ page });
    await kill(nuxt.pid);
  });
}
