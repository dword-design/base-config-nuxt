import withLocalTmpDir from 'with-local-tmp-dir'
import outputFiles from 'output-files'
import { endent } from '@dword-design/functions'
import P from 'path'
import execa from 'execa'
import kill from 'tree-kill-promise'
import { mkdir, chmod } from 'fs-extra'
import portReady from 'port-ready'
import puppeteer from '@dword-design/puppeteer'
import getPackageName from 'get-package-name'
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
  'router config': () => withLocalTmpDir(async () => {
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
            router: {
              base: '/app/',
            },
          }
        `,
        pages: {
          'index.js': endent`
            export default {
              render: () => <div class="foo">
                <nuxt-link to={{ name: 'index' }} class="home">Home</nuxt-link>
                <nuxt-link to={{ name: 'inner.info' }} class="info">Info</nuxt-link>
              </div>,
            }
          `,
          'inner/info.js': endent`
            export default {
              render: () => {},
            }
          `,
        },
      },
    })
    await execa.command('base prepare')
    await execa.command('base prepublishOnly')
    const childProcess = start()
    try {
      await portReady(3000)
      await page.goto('http://localhost:3000/app')
      expect(await page.$eval('.home.active', el => el.textContent)).toEqual('Home')
      expect(await page.$eval('.info', el => el.getAttribute('href'))).toEqual('/app/inner/info')
    } finally {
      await kill(childProcess.pid)
    }
  }),
  hexrgba: () => withLocalTmpDir(async () => {
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
        'assets/style.css': endent`
          body {
            background: rgba(#fff, .5);
          }
        `,
        'index.js': endent`
          export default {
            css: ['assets/style.css'],
          }
        `,
        'pages/index.js': endent`
          export default {
            render: () => <div />,
          }
        `,
      },
    })
    await execa.command('base prepare')
    await execa.command('base prepublishOnly')
    const childProcess = start()
    try {
      await portReady(3000)
      await page.goto('http://localhost:3000/app')
      const backgroundColor = await page.$eval('body', el => getComputedStyle(el).backgroundColor)
      expect(backgroundColor).toEqual('rgba(0, 0, 0, 0)')
    } finally {
      await kill(childProcess.pid)
    }
  }),
  'postcss plugin': () => withLocalTmpDir(async () => {
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
        'assets/style.css': endent`
          body {
            background: rgba(#fff, .5);
          }
        `,
        'index.js': endent`
          export default {
            css: ['assets/style.css'],
            postcssPlugins: {
              '${getPackageName(require.resolve('postcss-hexrgba'))}': {},
            },
          }
        `,
        'pages/index.js': endent`
          export default {
            render: () => <div />,
          }
        `,
      },
    })
    await execa.command('base prepare')
    await execa.command('base prepublishOnly')
    const childProcess = start()
    try {
      await portReady(3000)
      await page.goto('http://localhost:3000/app')
      const backgroundColor = await page.$eval('body', el => getComputedStyle(el).backgroundColor)
      expect(backgroundColor).toEqual('rgba(255, 255, 255, 0.5)')
    } finally {
      await kill(childProcess.pid)
    }
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
