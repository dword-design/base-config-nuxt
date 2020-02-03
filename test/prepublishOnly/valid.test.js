import withLocalTmpDir from 'with-local-tmp-dir'
import outputFiles from 'output-files'
import { spawn } from 'child-process-promise'
import { endent } from '@dword-design/functions'
import puppeteer from 'puppeteer'
import expect from 'expect'
import { readFile } from 'fs-extra'
import delay from 'delay'

export default () => withLocalTmpDir(__dirname, async () => {
  await outputFiles({
    'package.json': endent`
      {
        "baseConfig": {
          "name": "nuxt",
          "mode": "spa"
        },
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

  await spawn('base', ['build'])
  const childProcess = spawn('base', ['start'])
    .catch(error => {
      if (error.code !== null) {
        throw error
      }
    })
    .childProcess
  await delay(5000)
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  await page.goto('http://localhost:3000')
  expect(await page.content()).toMatch('<div>Hello world</div>')
  await browser.close()
  expect(await readFile('.gitignore', 'utf8')).toMatch('.nuxt\n')
  childProcess.kill()
})
