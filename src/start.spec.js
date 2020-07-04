import { endent, mapValues } from '@dword-design/functions'
import puppeteer from '@dword-design/puppeteer'
import execa from 'execa'
import outputFiles from 'output-files'
import portReady from 'port-ready'
import kill from 'tree-kill-promise'
import withLocalTmpDir from 'with-local-tmp-dir'

import start from './start'

let browser
let page
const runTest = config => () =>
  withLocalTmpDir(async () => {
    await outputFiles({
      'package.json': JSON.stringify(
        {
          baseConfig: require.resolve('.'),
        },
        undefined,
        2
      ),
      ...config.files,
    })
    await execa.command('base prepare')
    await execa.command('base prepublishOnly')
    const childProcess = start({ log: false })
    await portReady(3000)
    await page.goto('http://localhost:3000')
    await config.test()
    await kill(childProcess.pid)
  })

export default {
  after: () => browser.close(),
  before: async () => {
    browser = await puppeteer.launch()
    page = await browser.newPage()
  },
  ...({
    valid: {
      files: {
        'pages/index.vue': endent`
          <template>
            <div>Hello world</div>
          </template>
          
        `,
      },
      test: async () =>
        expect(await page.$eval('div', div => div.textContent)).toEqual(
          'Hello world'
        ),
    },
  } |> mapValues(runTest)),
}
