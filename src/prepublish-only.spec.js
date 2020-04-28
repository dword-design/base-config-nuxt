import withLocalTmpDir from 'with-local-tmp-dir'
import outputFiles from 'output-files'
import { endent } from '@dword-design/functions'
import P from 'path'
import execa from 'execa'
import kill from 'tree-kill-promise'
import { chmod } from 'fs-extra'
import portReady from 'port-ready'
import puppeteer from '@dword-design/puppeteer'
import start from './start'

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
    await execa.command('base prepublishOnly')
    const childProcess = start()
    await portReady(3000)
    const browser = await puppeteer.launch()
    const page = await browser.newPage()
    await page.goto('http://localhost:3000')
    expect(await page.$eval('div', div => div.textContent)).toEqual('Hello world')
    await kill(childProcess.pid)
    await browser.close()
  }),
  aliases: () => withLocalTmpDir(async () => {
    await outputFiles({
      'package.json': endent`
        {
          "baseConfig": "nuxt",
          "devDependencies": {
            "@dword-design/base-config-nuxt": "^1.0.0"
          }
        }

      `,
      src: {
        'model/foo.js': 'export default \'Hello world\'',
        'pages/index.js': endent`
          import foo from '@/model/foo'

          export default {
            render: () => <div>{ foo }</div>,
          }
        `,
      },
    })
    await execa.command('base prepare')
    await execa.command('base prepublishOnly')
    const childProcess = start()
    await portReady(3000)
    const browser = await puppeteer.launch()
    const page = await browser.newPage()
    await page.goto('http://localhost:3000')
    expect(await page.$eval('div', div => div.textContent)).toEqual('Hello world')
    await kill(childProcess.pid)
    await browser.close()
  }),
  'console output': () => withLocalTmpDir(async () => {
    await outputFiles({
      'package.json': endent`
        {
          "baseConfig": "nuxt",
          "devDependencies": {
            "@dword-design/base-config-nuxt": "^1.0.0"
          }
        }

      `,
      src: {
        'index.js': endent`
          export default {
            modules: [
              () => console.log('foo bar'),
            ],
          }
        `,
      },
    })
    await execa.command('base prepare')
    const { all } = await execa.command('base prepublishOnly', { all: true })
    expect(all).toMatch('foo bar')
  }),
  cli: () => withLocalTmpDir(async () => {
    await outputFiles({
      'package.json': endent`
        {
          "baseConfig": "nuxt",
          "devDependencies": {
            "@dword-design/base-config-nuxt": "^1.0.0"
          }
        }

      `,
      src: {
        'cli.js': endent`
          #!/usr/bin/env node

          import foo from './foo'

          console.log(foo)
        `,
        'foo.js': 'export default \'foo\'',
      },
    })
    await execa.command('base prepare')
    await execa.command('base prepublishOnly')
    await chmod(P.join('dist', 'cli.js'), '755')
    const { all } = await execa.command('./dist/cli.js', { all: true })
    expect(all).toEqual('foo')
  }),
  'linting error in cli': () => withLocalTmpDir(async () => {
    await outputFiles({
      'package.json': endent`
        {
          "baseConfig": "nuxt",
          "devDependencies": {
            "@dword-design/base-config-nuxt": "^1.0.0"
          }
        }

      `,
      'src/cli.js': endent`
        #!/usr/bin/env node

        console.log('foo');
      `,
    })

    await execa.command('base prepare')
    let all
    try {
      await execa.command('base prepublishOnly', { all: true })
    } catch (error) {
      all = error.all
    }
    expect(all).toMatch('error  Extra semicolon  semi')
  }),
}
