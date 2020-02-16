import withLocalTmpDir from 'with-local-tmp-dir'
import outputFiles from 'output-files'
import { spawn } from 'child-process-promise'
import { endent } from '@dword-design/functions'
import stealthyRequire from 'stealthy-require'
import portReady from 'port-ready'
import puppeteer from 'puppeteer'
import kill from 'tree-kill'
import { mkdir } from 'fs-extra'

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
  await spawn('base', ['prepublishOnly'])
  await mkdir('foo')
  process.chdir('foo')
  const baseConfigNuxt = stealthyRequire(require.cache, () => require('@dword-design/base-config-nuxt'))
  const childProcess = baseConfigNuxt.commands.start({ rootDir: '..' })
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
  expect(page.content() |> await).toMatch('<div>Hello world</div>'),
  await browser.close()
  kill(childProcess.pid)
})
