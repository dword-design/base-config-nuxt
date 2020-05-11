import withLocalTmpDir from 'with-local-tmp-dir'
import outputFiles from 'output-files'
import { endent, mapValues } from '@dword-design/functions'
import execa from 'execa'
import kill from 'tree-kill-promise'
import portReady from 'port-ready'
import puppeteer from '@dword-design/puppeteer'
import start from './start'

let browser
let page

const runTest = ({ files, test }) => () =>
  withLocalTmpDir(async () => {
    await outputFiles({
      'package.json': JSON.stringify(
        {
          baseConfig: require.resolve('.'),
        },
        undefined,
        2
      ),
      src: files,
    })
    await execa.command('base prepare')
    await execa.command('base prepublishOnly')
    const childProcess = start()
    await portReady(3000)
    await page.goto('http://localhost:3000')
    await test()
    await kill(childProcess.pid)
  })

export default {
  before: async () => {
    browser = await puppeteer.launch()
    page = await browser.newPage()
  },
  after: () => browser.close(),
  ...({
    valid: {
      files: {
        'pages/index.js': endent`
          export default {
            render: () => <div>Hello world</div>,
          }
        `,
      },
      test: async () =>
        expect(await page.$eval('div', div => div.textContent)).toEqual(
          'Hello world'
        ),
    },
    aliases: {
      files: {
        'model/foo.js': "export default 'Hello world'",
        'pages/index.js': endent`
          import foo from '@/model/foo'

          export default {
            render: () => <div>{ foo }</div>,
          }
        `,
      },
      test: async () =>
        expect(await page.$eval('div', div => div.textContent)).toEqual(
          'Hello world'
        ),
    },
  } |> mapValues(runTest)),
}
