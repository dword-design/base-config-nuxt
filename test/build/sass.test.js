import withLocalTmpDir from 'with-local-tmp-dir'
import outputFiles from 'output-files'
import { spawn } from 'child-process-promise'
import sortPackageJson from 'sort-package-json'
import { endent } from '@dword-design/functions'
import getPackageName from 'get-package-name'
import puppeteer from 'puppeteer'
import P from 'path'
import express from 'express'
import expect from 'expect'
import portfinder from 'portfinder'
import { readFile } from 'fs-extra'
import packageConfig from '../package.config'

export const it = () => withLocalTmpDir(__dirname, async () => {
  await outputFiles({
    'package.json': JSON.stringify(sortPackageJson({
      ...packageConfig,
      dependencies: {
        'vue': '^1.0.0',
      },
      devDependencies: {
        '@dword-design/base-config-vue-app': '^1.0.0',
      },
    }), undefined, 2),
    'src/index.js': endent`
      import Vue from '${getPackageName(require.resolve('vue'))}'
      import './style.scss'

      new Vue({
        el: '#app',
        render: () => <div>Hello world</div>,
      })
    `,
    'src/style.scss': endent`
      body {
        background: red;
      }
    `,
  })

  await spawn('base', ['build'])

  const port = await portfinder.getPortPromise()
  const app = express().use(express.static(P.resolve('dist'))).listen(port)
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  await page.goto(`http://localhost:${port}`)
  const content = await page.content()
  expect(content).toMatch(/<style type="text\/css">body {\n  background: red; }\n<\/style>/)
  expect(content).toMatch(/<div>Hello world<\/div>/)
  await browser.close()
  app.close()
  expect(await readFile('.gitignore', 'utf8')).toMatch('.linaria-cache\n')
})

export const timeout = 30000
