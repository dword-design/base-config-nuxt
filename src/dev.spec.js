import { Base } from '@dword-design/base';
import { delay, endent } from '@dword-design/functions';
import tester from '@dword-design/tester';
import testerPluginTmpDir from '@dword-design/tester-plugin-tmp-dir';
import fs from 'fs-extra';
import nuxtDevReady from 'nuxt-dev-ready';
import outputFiles from 'output-files';
import P from 'path';
import { chromium } from 'playwright';
import kill from 'tree-kill-promise';

import self from './dev.js';
import config from './index.js';

export default tester(
  {
    async 'fixable linting error'() {
      await fs.outputFile(
        'pages/index.vue',
        endent`
          <template>
            <div class="foo" />
          </template>

          <script>
          export default {}
          </script>
        `,
      );

      await new Base(config).prepare();
      const nuxt = self();

      try {
        await nuxtDevReady();
        await this.page.goto('http://localhost:3000');
        await this.page.waitForSelector('.foo', { state: 'attached' });

        expect(await fs.readFile(P.join('pages', 'index.vue'), 'utf8'))
          .toEqual(endent`
            <template>
              <div class="foo" />
            </template>

            <script>
            export default {};
            </script>

          `);
      } finally {
        await kill(nuxt.pid);
      }
    },
    async valid() {
      await outputFiles({
        'pages/index.vue': endent`
          <template>
            <div class="foo">Hello world</div>
          </template>
        `,
      });

      const base = new Base(config);
      await base.prepare();
      const nuxt = self();

      try {
        await nuxtDevReady();
        await this.page.goto('http://localhost:3000');
        let handle = await this.page.waitForSelector('.foo');

        expect(await handle.evaluate(el => el.textContent)).toEqual(
          'Hello world',
        );

        await delay(1000); // for some reason Puppeteer does not detect the change without the delay

        await fs.outputFile(
          P.join('pages', 'index.vue'),
          endent`
            <template>
              <div class="bar">Hello world</div>
            </template>
          `,
        );

        handle = await this.page.waitForSelector('.bar');

        expect(await handle.evaluate(el => el.textContent)).toEqual(
          'Hello world',
        );
      } finally {
        await kill(nuxt.pid);
      }
    },
  },
  [
    testerPluginTmpDir(),
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
  ],
);
