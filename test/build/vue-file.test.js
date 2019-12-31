import withLocalTmpDir from 'with-local-tmp-dir'
import outputFiles from 'output-files'
import { spawn } from 'child-process-promise'
import { endent } from '@dword-design/functions'
import getPackageName from 'get-package-name'
import puppeteer from 'puppeteer'
import P from 'path'
import express from 'express'
import expect from 'expect'
import portfinder from 'portfinder'

export const it = () => withLocalTmpDir(__dirname, async () => {
  await outputFiles({
    'package.json': endent`
      {
        "baseConfig": "vue-app",
        "dependencies": {
          "vue": "^1.0.0"
        },
        "devDependencies": {
          "@dword-design/base-config-vue-app": "^1.0.0"
        }
      }
    `,
    'src/app.vue': endent`
      <script>
      export default {
        render: () => <div>Hello world</div>,
      }
      </script>
    `,
    'src/index.js': endent`
      import Vue from '${getPackageName(require.resolve('vue'))}'
      import App from './app.vue'

      new Vue({
        el: '#app',
        render: () => <App/>,
      })
    `,
  })

  await spawn('base', ['build'])

  const port = await portfinder.getPortPromise()
  const app = express().use(express.static(P.resolve('dist'))).listen(port)
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  await page.goto(`http://localhost:${port}`)
  expect(await page.content()).toMatch('<div>Hello world</div>')
  await browser.close()
  app.close()
})

export const timeout = 30000
