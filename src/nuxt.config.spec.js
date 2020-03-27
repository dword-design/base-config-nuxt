import withLocalTmpDir from 'with-local-tmp-dir'
import outputFiles from 'output-files'
import { endent, mapValues } from '@dword-design/functions'
import puppeteer from '@dword-design/puppeteer'
import getPackageName from 'get-package-name'
import { Nuxt, Builder } from 'nuxt'
import self from './nuxt.config'

let browser
let page

export default {
  before: async () => {
    browser = await puppeteer.launch()
    page = await browser.newPage()
  },
  after: () => browser.close(),
  ...{
    valid: {
      setup: () => outputFiles({
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
      }),
      test: async () => expect(await page.$eval('div', div => div.textContent)).toEqual('Hello world'),
    },
    'sass import': {
      setup: () => outputFiles({
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
      }),
      test: async () => {
        const backgroundColor = await page.$eval('body', el => getComputedStyle(el).backgroundColor)
        expect(backgroundColor).toMatch('rgb(255, 0, 0)')
      },
    },
    sass: {
      setup: () => outputFiles({
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
      }),
      test: async () => {
        const backgroundColor = await page.$eval('body', el => getComputedStyle(el).backgroundColor)
        expect(backgroundColor).toMatch('rgb(255, 0, 0)')
      },
    },
    name: {
      setup: () => outputFiles({
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
              name: 'Test-App',
            }
          `,
          'pages/index.js': endent`
            export default {
              render: () => <div>Hello world</div>,
            }
          `,
        },
      }),
      test: async () => expect(await page.title()).toEqual('Test-App'),
    },
    'name and title': {
      setup: () => outputFiles({
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
              name: 'Test-App',
              title: 'This is the ultimate app!',
            }
          `,
          'pages/index.js': endent`
            export default {
              render: () => <div>Hello world</div>,
            }
          `,
        },
      }),
      test: async () => expect(await page.title()).toEqual('Test-App - This is the ultimate app!'),
    },
    'page with title': {
      setup: () => outputFiles({
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
              name: 'Test-App',
              title: 'This is the ultimate app!',
            }
          `,
          'pages/foo.js': endent`
            export default {
              head: {
                title: () => 'Foo page',
              },
              render: () => <div>Hello world</div>,
            }
          `,
        },
      }),
      url: '/foo',
      test: async () => expect(await page.title()).toEqual('Test-App - Foo page'),
    },
    htmlAttrs: {
      setup: () => outputFiles({
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
      }),
      test: async () => expect(await page.$eval('html', el => el.className)).toEqual('foo bar'),
    },
    headAttrs: {
      setup: () => outputFiles({
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
      }),
      test: async () => expect(await page.$eval('head', el => el.className)).toEqual('foo bar'),
    },
    bodyAttrs: {
      setup: () => outputFiles({
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
      }),
      test: async () => expect(await page.$eval('body', el => el.className)).toEqual('foo bar'),
    },
    'router config': {
      setup: () => outputFiles({
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
      }),
      url: '/app',
      test: async () => {
        expect(await page.$eval('.home.active', el => el.textContent)).toEqual('Home')
        expect(await page.$eval('.info', el => el.getAttribute('href'))).toEqual('/app/inner/info')
      },
    },
    hexrgba: {
      setup: () => outputFiles({
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
      }),
      test: async () => {
        const backgroundColor = await page.$eval('body', el => getComputedStyle(el).backgroundColor)
        expect(backgroundColor).toEqual('rgba(0, 0, 0, 0)')
      },
    },
    'postcss plugin': {
      setup: () => outputFiles({
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
      }),
      test: async () => {
        const backgroundColor = await page.$eval('body', el => getComputedStyle(el).backgroundColor)
        expect(backgroundColor).toEqual('rgba(255, 255, 255, 0.5)')
      },
    },
    port: {
      setup: () => {
        process.env.PORT = 3005
        return outputFiles({
          'package.json': endent`
            {
              "baseConfig": "nuxt",
              "devDependencies": {
                "@dword-design/base-config-nuxt": "^1.0.0"
              }
            }

          `,
          src: {
            'pages/index.js': endent`
              export default {
                render: () => <div>Hello world</div>,
              }
            `,
          },
        })
      },
      port: 3005,
      test: async () => {
        expect(await page.$eval('div', div => div.textContent)).toEqual('Hello world')
        delete process.env.PORT
      },
    },
  }
    |> mapValues(({ setup, port = 3000, url = '', test }) => () => withLocalTmpDir(async () => {
      setup() |> await
      const nuxt = new Nuxt({ ...self, dev: false, build: { quiet: true } })
      new Builder(nuxt).build() |> await
      nuxt.listen() |> await
      try {
        page.goto(`http://localhost:${port}${url}`) |> await
        test() |> await
      } finally {
        nuxt.close() |> await
      }
    })),
}
