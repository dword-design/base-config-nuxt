import { Base } from '@dword-design/base';
import { endent } from '@dword-design/functions';
import tester from '@dword-design/tester';
import testerPluginTmpDir from '@dword-design/tester-plugin-tmp-dir';
import outputFiles from 'output-files';
import { chromium } from 'playwright';
import portReady from 'port-ready';
import kill from 'tree-kill-promise';

import config from './index.js';
import prepublishOnly from './prepublish-only.js';
import self from './start.js';

export default tester(
  {
    valid: {
      files: {
        'pages/index.vue': endent`
          <template>
            <div>Hello world</div>
          </template>

        `,
      },
      async test() {
        expect(await this.page.$eval('div', div => div.textContent)).toEqual(
          'Hello world',
        );
      },
    },
  },
  [
    {
      transform: test =>
        async function () {
          await outputFiles(test.files);
          await new Base(config).prepare();
          await prepublishOnly({ log: false });
          const nuxt = self();
          await portReady(3000);
          await this.page.goto('http://localhost:3000');
          await test.test.call(this);
          await kill(nuxt.pid);
        },
    },
    {
      async after() {
        await this.browser.close();
      },
      async afterEach() {
        await this.page.close();
      },
      async before() {
        this.browser = await chromium.launch();
      },
      async beforeEach() {
        this.page = await this.browser.newPage();
      },
    },
    testerPluginTmpDir(),
  ],
);
