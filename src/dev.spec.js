import { Base } from '@dword-design/base'
import { endent } from '@dword-design/functions'
import tester from '@dword-design/tester'
import testerPluginPuppeteer from '@dword-design/tester-plugin-puppeteer'
import testerPluginTmpDir from '@dword-design/tester-plugin-tmp-dir'
import fs from 'fs-extra'
import outputFiles from 'output-files'
import P from 'path'
import portReady from 'port-ready'
import kill from 'tree-kill-promise'

import self from './dev.js'
import config from './index.js'

export default tester(
  {
    async valid() {
      await outputFiles({
        'package.json': JSON.stringify({}),
        'pages/index.vue': endent`
          <template>
            <div class="foo">Hello world</div>
          </template>
        `,
      })

      const base = new Base(config)
      await base.prepare()

      const nuxt = await self()
      try {
        await portReady(3000)
        await this.page.goto('http://localhost:3000')
        let handle = await this.page.waitForSelector('.foo')
        expect(await handle.evaluate(el => el.textContent)).toEqual(
          'Hello world',
        )
        await fs.outputFile(
          P.join('pages', 'index.vue'),
          endent`
            <template>
              <div class="bar">Hello world</div>
            </template>
          `,
        )
        handle = await this.page.waitForSelector('.bar')
        expect(await handle.evaluate(el => el.textContent)).toEqual(
          'Hello world',
        )
      } finally {
        await kill(nuxt.pid)
      }
    },
  },
  [testerPluginPuppeteer(), testerPluginTmpDir()],
)
