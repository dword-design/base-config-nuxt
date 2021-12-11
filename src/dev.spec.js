import { endent } from '@dword-design/functions'
import tester from '@dword-design/tester'
import testerPluginPuppeteer from '@dword-design/tester-plugin-puppeteer'
import testerPluginTmpDir from '@dword-design/tester-plugin-tmp-dir'
import execa from 'execa'
import outputFiles from 'output-files'
import portReady from 'port-ready'
import kill from 'tree-kill-promise'

export default tester(
  {
    async valid() {
      await outputFiles({
        'node_modules/base-config-self/index.js':
          "module.exports = require('../../../src')",
        'package.json': JSON.stringify(
          {
            baseConfig: 'self',
          },
          undefined,
          2
        ),
        'pages/index.vue': endent`
        <template>
          <div class="foo">Hello world</div>
        </template>

      `,
      })
      await execa.command('base prepare')

      const childProcess = execa.command('base dev')
      try {
        await portReady(3000)
        await this.page.goto('http://localhost:3000')

        const handle = await this.page.waitForSelector('.foo')
        expect(await handle.evaluate(el => el.textContent)).toEqual(
          'Hello world'
        )
      } finally {
        await kill(childProcess.pid)
      }
    },
  },
  [testerPluginPuppeteer(), testerPluginTmpDir()]
)
