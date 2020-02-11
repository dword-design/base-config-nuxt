import withLocalTmpDir from 'with-local-tmp-dir'
import outputFiles from 'output-files'
import { spawn } from 'child-process-promise'
import { endent, includes } from '@dword-design/functions'
import portReady from 'port-ready'
import puppeteer from 'puppeteer'
import kill from 'tree-kill'
import waitFor from 'p-wait-for'

export default () => withLocalTmpDir(__dirname, async () => {
  await outputFiles({
    'package.json': endent`
      {
        "baseConfig": "nuxt",
        "devDependencies": {
          "@dword-design/base-config-nuxt": "^1.0.0"
        }
      }

    `,
    'src/pages/index.js': endent`
      export default {
        render: () => <div>Hello world</div>,
      }
    `,
  })

  await spawn('base', ['prepare'])
  const childProcess = spawn('base', ['dev'])
    .catch(error => {
      if (error.code !== null) {
        throw error
      }
    })
    .childProcess
  await portReady(3000)
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  await page.goto('http://localhost:3000')
  await waitFor(
    async () => page.content() |> await |> includes('<div>Hello world</div>'),
    { interval: 300 },
  )
  await browser.close()
  kill(childProcess.pid)
})
