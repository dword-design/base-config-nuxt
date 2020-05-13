import withLocalTmpDir from 'with-local-tmp-dir'
import outputFiles from 'output-files'
import { endent, mapValues } from '@dword-design/functions'
import puppeteer from '@dword-design/puppeteer'
import getPackageName from 'get-package-name'
import { Nuxt, Builder } from 'nuxt'
import execa from 'execa'
import self from './nuxt.config'

let browser
let page

const runTest = ({ files, test }) => () =>
  withLocalTmpDir(async () => {
    await outputFiles(files)
    await execa.command('base prepare')
    const nuxt = new Nuxt({ ...self, dev: false, build: { quiet: true } })
    await new Builder(nuxt).build()
    await nuxt.listen()
    try {
      await test()
    } finally {
      await nuxt.close()
    }
  })

export default {
  before: async () => {
    browser = await puppeteer.launch()
    page = await browser.newPage()
  },
  after: () => browser.close(),
  ...({
    valid: {
      files: {
        'package.json': JSON.stringify(
          {
            baseConfig: require.resolve('.'),
          },
          undefined,
          2
        ),
        'pages/index.vue': endent`
          <template>
            <div>Hello world</div>
          </template>

        `,
      },
      test: async () => {
        await page.goto('http://localhost:3000')
        expect(await page.$eval('div', div => div.textContent)).toEqual(
          'Hello world'
        )
      },
    },
    'sass import': {
      files: {
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
        'package.json': JSON.stringify(
          {
            baseConfig: require.resolve('.'),
            dependencies: {
              'sass-foo': '^1.0.0',
            },
          },
          undefined,
          2
        ),
        'assets/style.scss': "@import '~sass-foo'",
        'nuxt.config.js': endent`
          export default {
            css: [
              '~/assets/style.scss',
            ],
          }
        `,
        'pages/index.vue': endent`
          <template>
            <div>Hello world</div>
          </template>

        `,
      },
      test: async () => {
        await page.goto('http://localhost:3000')
        const backgroundColor = await page.$eval(
          'body',
          el => getComputedStyle(el).backgroundColor
        )
        expect(backgroundColor).toMatch('rgb(255, 0, 0)')
      },
    },
    sass: {
      files: {
        'package.json': JSON.stringify(
          {
            baseConfig: require.resolve('.'),
          },
          undefined,
          2
        ),
        'assets/style.scss': endent`
          body {
            background: red;
          }
        `,
        'nuxt.config.js': endent`
          export default {
            css: [
              '~/assets/style.scss',
            ],
          }
        `,
        'pages/index.vue': endent`
          <template>
            <div>Hello world</div>
          </template>

        `,
      },
      test: async () => {
        await page.goto('http://localhost:3000')
        const backgroundColor = await page.$eval(
          'body',
          el => getComputedStyle(el).backgroundColor
        )
        expect(backgroundColor).toMatch('rgb(255, 0, 0)')
      },
    },
    name: {
      files: {
        'package.json': JSON.stringify(
          {
            baseConfig: require.resolve('.'),
          },
          undefined,
          2
        ),
        'nuxt.config.js': endent`
          export default {
            name: 'Test-App',
          }
        `,
        'pages/index.vue': endent`
          <template>
            <div>Hello world</div>
          </template>

        `,
      },
      test: async () => {
        await page.goto('http://localhost:3000')
        expect(await page.title()).toEqual('Test-App')
      },
    },
    'name and title': {
      files: {
        'package.json': JSON.stringify(
          {
            baseConfig: require.resolve('.'),
          },
          undefined,
          2
        ),
        'nuxt.config.js': endent`
          export default {
            name: 'Test-App',
            title: 'This is the ultimate app!',
          }
        `,
        'pages/index.vue': endent`
          <template>
            <div>Hello world</div>
          </template>

        `,
      },
      test: async () => {
        await page.goto('http://localhost:3000')
        expect(await page.title()).toEqual(
          'Test-App - This is the ultimate app!'
        )
      },
    },
    'page with title': {
      files: {
        'package.json': JSON.stringify(
          {
            baseConfig: require.resolve('.'),
          },
          undefined,
          2
        ),
        'nuxt.config.js': endent`
          export default {
            name: 'Test-App',
            title: 'This is the ultimate app!',
          }
        `,
        'pages/foo.vue': endent`
          <template>
            <div>Hello worldy</div>
          </template>

          <script>
          export default {
            head: {
              title: () => 'Foo page',
            },
          }
          </script>

        `,
      },
      test: async () => {
        await page.goto('http://localhost:3000/foo')
        expect(await page.title()).toEqual('Test-App - Foo page')
      },
    },
    htmlAttrs: {
      files: {
        'package.json': JSON.stringify(
          {
            baseConfig: require.resolve('.'),
          },
          undefined,
          2
        ),
        'nuxt.config.js': endent`
          export default {
            htmlAttrs: {
              class: 'foo bar',
            },
          }
        `,
        'pages/index.vue': endent`
          <template>
            <div>Hello world</div>
          </template>

        `,
      },
      test: async () => {
        await page.goto('http://localhost:3000')
        expect(await page.$eval('html', el => el.className)).toEqual('foo bar')
      },
    },
    headAttrs: {
      files: {
        'package.json': JSON.stringify(
          {
            baseConfig: require.resolve('.'),
          },
          undefined,
          2
        ),
        'nuxt.config.js': endent`
          export default {
            headAttrs: {
              class: 'foo bar',
            },
          }
        `,
        'pages/index.vue': endent`
          <template>
            <div>Hello world</div>
          </template>

        `,
      },
      test: async () => {
        await page.goto('http://localhost:3000')
        expect(await page.$eval('head', el => el.className)).toEqual('foo bar')
      },
    },
    bodyAttrs: {
      files: {
        'package.json': JSON.stringify(
          {
            baseConfig: require.resolve('.'),
          },
          undefined,
          2
        ),
        'nuxt.config.js': endent`
          export default {
            bodyAttrs: {
              class: 'foo bar',
            },
          }
        `,
        'pages/index.vue': endent`
          <template>
            <div>Hello world</div>
          </template>

        `,
      },
      test: async () => {
        await page.goto('http://localhost:3000')
        expect(await page.$eval('body', el => el.className)).toEqual('foo bar')
      },
    },
    'router config': {
      files: {
        'package.json': JSON.stringify(
          {
            baseConfig: require.resolve('.'),
          },
          undefined,
          2
        ),
        'nuxt.config.js': endent`
          export default {
            router: {
              base: '/app/',
            },
          }
        `,
        pages: {
          'index.vue': endent`
            <template>
              <div class="foo">
                <nuxt-link :to="{ name: 'index' }" class="home">
                  Home
                </nuxt-link>
                <nuxt-link :to="{ name: 'inner.info' }" class="info">
                  Info
                </nuxt-link>
              </div>
            </template>

          `,
          'inner/info.vue': '',
        },
      },
      test: async () => {
        await page.goto('http://localhost:3000/app')
        expect(await page.$eval('.home.active', el => el.textContent)).toMatch(
          'Home'
        )
        expect(
          await page.$eval('.info', el => el.getAttribute('href'))
        ).toEqual('/app/inner/info')
      },
    },
    hexrgba: {
      files: {
        'package.json': JSON.stringify(
          {
            baseConfig: require.resolve('.'),
          },
          undefined,
          2
        ),
        'assets/style.css': endent`
          body {
            background: rgba(#fff, .5);
          }
        `,
        'nuxt.config.js': endent`
          export default {
            css: ['assets/style.css'],
          }
        `,
        'pages/index.vue': endent`
          <template>
            <div />
          </template>
          
        `,
      },
      test: async () => {
        await page.goto('http://localhost:3000')
        const backgroundColor = await page.$eval(
          'body',
          el => getComputedStyle(el).backgroundColor
        )
        expect(backgroundColor).toEqual('rgba(0, 0, 0, 0)')
      },
    },
    'postcss plugin': {
      files: {
        'package.json': JSON.stringify(
          {
            baseConfig: require.resolve('.'),
          },
          undefined,
          2
        ),
        'assets/style.css': endent`
          body {
            background: rgba(#fff, .5);
          }
        `,
        'nuxt.config.js': endent`
          export default {
            css: ['assets/style.css'],
            postcssPlugins: {
              '${getPackageName(require.resolve('postcss-hexrgba'))}': {},
            },
          }
        `,
        'pages/index.vue': endent`
          <template>
            <div />
          </template>

        `,
      },
      test: async () => {
        await page.goto('http://localhost:3000')
        const backgroundColor = await page.$eval(
          'body',
          el => getComputedStyle(el).backgroundColor
        )
        expect(backgroundColor).toEqual('rgba(255, 255, 255, 0.5)')
      },
    },
    dotenv: {
      files: {
        '.test.env.json': { foo: 'bar' } |> JSON.stringify,
        '.env.schema.json': { foo: { type: 'string' } } |> JSON.stringify,
        'package.json': JSON.stringify(
          {
            baseConfig: require.resolve('.'),
          },
          undefined,
          2
        ),
        'nuxt.config.js': endent`
          export default {
            modules: [
              'modules/foo',
            ],
          }
        `,
        'modules/foo.js': endent`
          export default function () {
            this.options.head.titleTemplate = process.env.FOO
          }
        `,
        'pages/index.vue': endent`
          <template>
            <div>Hello world</div>
          </template>

        `,
      },
      test: async () => {
        await page.goto('http://localhost:3000')
        expect(await page.title()).toEqual('bar')
      },
    },
    port: {
      files: {
        '.test.env.json': { port: 3005 } |> JSON.stringify,
        '.env.schema.json': { port: { type: 'integer' } } |> JSON.stringify,
        'package.json': JSON.stringify(
          {
            baseConfig: require.resolve('.'),
          },
          undefined,
          2
        ),
        'pages/index.vue': endent`
          <template>
            <div>Hello world</div>
          </template>

        `,
      },
      test: async () => {
        await page.goto('http://localhost:3005')
        expect(await page.$eval('div', div => div.textContent)).toEqual(
          'Hello world'
        )
        delete process.env.PORT
      },
    },
  } |> mapValues(runTest)),
}
