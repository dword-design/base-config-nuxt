import withLocalTmpDir from 'with-local-tmp-dir'
import outputFiles from 'output-files'
import execa from 'execa'
import { endent } from '@dword-design/functions'
import stealthyRequire from 'stealthy-require'
import portReady from 'port-ready'
import puppeteer from '@dword-design/puppeteer'
import kill from 'tree-kill'
import { mkdir } from 'fs-extra'

export default {
  subdir: () => withLocalTmpDir(async () => {
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
    await execa.command('base prepublishOnly')
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
  }),
  valid: () => withLocalTmpDir(__dirname, async () => {
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
    await execa.command('base prepublishOnly')
    const childProcess = execa.command('base start')
    await portReady(3000)
    const browser = await puppeteer.launch()
    const page = await browser.newPage()
    await page.goto('http://localhost:3000')
    expect(await page.content()).toMatch('<div>Hello world</div>')
    await browser.close()
    kill(childProcess.pid)
  }),
}
