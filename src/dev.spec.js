import withLocalTmpDir from 'with-local-tmp-dir'
import outputFiles from 'output-files'
import execa from 'execa'
import { endent, includes } from '@dword-design/functions'
import portReady from 'port-ready'
import puppeteer from '@dword-design/puppeteer'
import kill from 'tree-kill'
import waitFor from 'p-wait-for'

export default {
  valid: () => withLocalTmpDir(async () => {
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

    await execa.command('base prepare')
    const childProcess = execa.command('base dev')
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
  }),
}
