import { endent } from '@dword-design/functions';
import tester from '@dword-design/tester';
import testerPluginTmpDir from '@dword-design/tester-plugin-tmp-dir';
import outputFiles from 'output-files';
import { chromium } from 'playwright';
import portReady from 'port-ready';
import kill from 'tree-kill-promise';
import { Base } from '@dword-design/base';
import config from './index.js';

export default tester(
  {
    valid: {
      files: {
        'pages/index.vue': endent`
          <template>
            <div class="foo">Hello world</div>
          </template>\n
        `,
      },
      async test() {
        expect(await this.page.$eval('.foo', div => div.textContent)).toEqual(
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
          const base = new Base(config);
          await base.prepare();
          await base.run('prepublishOnly');
          const nuxt = base.run('start');
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
