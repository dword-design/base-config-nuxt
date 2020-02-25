import withLocalTmpDir from 'with-local-tmp-dir'
import outputFiles from 'output-files'
import { endent } from '@dword-design/functions'
import P from 'path'
import execa from 'execa'
import kill from 'tree-kill-promise'
import { mkdir, chmod } from 'fs-extra'
import portReady from 'port-ready'
import puppeteer from '@dword-design/puppeteer'
import start from './start'

let browser
let page

export default {
  before: async () => {
    browser = await puppeteer.launch()
    page = await browser.newPage()
  },
  after: () => browser.close(),
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
    await page.goto('http://localhost:3000')
    expect(await page.$eval('div', div => div.textContent)).toEqual('Hello world')
    await kill(childProcess.pid)
  }),
  'sass import': () => withLocalTmpDir(async () => {
    await outputFiles({
      'node_modules/sass-foo': {
        'package.json': endent`
          {
            "main": "index.scss"
          }
        `,
        'index.scss': endent`
          body {
            background: red;
          }
        `,
      },
      'package.json': endent`
        {
          "baseConfig": "nuxt",
          "dependencies": {
            "sass-foo": "^1.0.0"
          },
          "devDependencies": {
            "@dword-design/base-config-nuxt": "^1.0.0"
          }
        }

      `,
      src: {
        'assets/style.scss': '@import \'~sass-foo\'',
        'index.js': endent`
          export default {
            css: [
              '~/assets/style.scss',
            ],
          }
        `,
        'pages/index.js': endent`
          export default {
            render: () => <div>Hello world</div>,
          }
        `,
      },
    })
    await execa.command('base prepare')
    await execa.command('base prepublishOnly')
    const childProcess = start()
    await portReady(3000)
    await page.goto('http://localhost:3000')
    const backgroundColor = await page.$eval('body', el => getComputedStyle(el).backgroundColor)
    expect(backgroundColor).toMatch('rgb(255, 0, 0)')
    await kill(childProcess.pid)
  }),
  sass: () => withLocalTmpDir(async () => {
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
        'assets/style.scss': endent`
          body {
            background: red;
          }
        `,
        'index.js': endent`
          export default {
            css: [
              '~/assets/style.scss',
            ],
          }
        `,
        'pages/index.js': endent`
          export default {
            render: () => <div>Hello world</div>,
          }
        `,
      },
    })
    await execa.command('base prepare')
    await execa.command('base prepublishOnly')
    const childProcess = start()
    await portReady(3000)
    await page.goto('http://localhost:3000')
    const backgroundColor = await page.$eval('body', el => getComputedStyle(el).backgroundColor)
    expect(backgroundColor).toMatch('rgb(255, 0, 0)')
    await kill(childProcess.pid)
  }),
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
    const childProcess = start({ rootDir: '..' })
    await portReady(3000)
    await page.goto('http://localhost:3000')
    expect(await page.$eval('div', div => div.textContent)).toEqual('Hello world')
    await kill(childProcess.pid)
  }),
  htmlAttrs: () => withLocalTmpDir(async () => {
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
            htmlAttrs: {
              class: 'foo bar',
            },
          }
        `,
        'pages/index.js': endent`
          export default {
            render: () => <div>Hello world</div>,
          }
        `,
      },
    })
    await execa.command('base prepare')
    await execa.command('base prepublishOnly')
    const childProcess = start()
    await portReady(3000)
    await page.goto('http://localhost:3000')
    expect(await page.$eval('html', el => el.className)).toEqual('foo bar')
    await kill(childProcess.pid)
  }),
  headAttrs: () => withLocalTmpDir(async () => {
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
            headAttrs: {
              class: 'foo bar',
            },
          }
        `,
        'pages/index.js': endent`
          export default {
            render: () => <div>Hello world</div>,
          }
        `,
      },
    })
    await execa.command('base prepare')
    await execa.command('base prepublishOnly')
    const childProcess = start()
    await portReady(3000)
    await page.goto('http://localhost:3000')
    expect(await page.$eval('head', el => el.className)).toEqual('foo bar')
    await kill(childProcess.pid)
  }),
  bodyAttrs: () => withLocalTmpDir(async () => {
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
            bodyAttrs: {
              class: 'foo bar',
            },
          }
        `,
        'pages/index.js': endent`
          export default {
            render: () => <div>Hello world</div>,
          }
        `,
      },
    })
    await execa.command('base prepare')
    await execa.command('base prepublishOnly')
    const childProcess = start()
    await portReady(3000)
    await page.goto('http://localhost:3000')
    expect(await page.$eval('body', el => el.className)).toEqual('foo bar')
    await kill(childProcess.pid)
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
