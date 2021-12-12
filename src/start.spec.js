import { endent } from '@dword-design/functions'
import tester from '@dword-design/tester'
import testerPluginPuppeteer from '@dword-design/tester-plugin-puppeteer'
import testerPluginTmpDir from '@dword-design/tester-plugin-tmp-dir'
import execa from 'execa'
import outputFiles from 'output-files'
import portReady from 'port-ready'
import kill from 'tree-kill-promise'

import self from './start'

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
          'Hello world'
        )
      },
    },
  },
  [
    {
      transform: config =>
        async function () {
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
            ...config.files,
          })
          await execa.command('base prepare')
          await execa.command('base prepublishOnly')

          const childProcess = self({ log: false })
          await portReady(3000)
          await this.page.goto('http://localhost:3000')
          await config.test.call(this)
          await kill(childProcess.pid)
        },
    },
    testerPluginPuppeteer(),
    testerPluginTmpDir(),
  ]
)
