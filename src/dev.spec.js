import { endent } from '@dword-design/functions'
import puppeteer from '@dword-design/puppeteer'
import execa from 'execa'
import outputFiles from 'output-files'
import portReady from 'port-ready'
import kill from 'tree-kill-promise'
import withLocalTmpDir from 'with-local-tmp-dir'

let browser
let page

export default {
  before: async () => {
    browser = await puppeteer.launch()
    page = await browser.newPage()
  },
  after: () => browser.close(),
  valid: () =>
    withLocalTmpDir(async () => {
      await outputFiles({
        'package.json': JSON.stringify(
          {
            baseConfig: require.resolve('.'),
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
        await page.goto('http://localhost:3000')
        const handle = await page.waitForSelector('.foo')
        expect(await handle.evaluate(el => el.textContent)).toEqual(
          'Hello world'
        )
      } finally {
        await kill(childProcess.pid)
      }
    }),
}
