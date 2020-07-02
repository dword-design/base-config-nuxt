import { endent, mapValues, property } from '@dword-design/functions'
import puppeteer from '@dword-design/puppeteer'
import axios from 'axios'
import execa from 'execa'
import getPackageName from 'get-package-name'
import { Builder, Nuxt } from 'nuxt'
import outputFiles from 'output-files'
import stealthyRequire from 'stealthy-require'
import withLocalTmpDir from 'with-local-tmp-dir'

let browser
let page
const runTest = config => () =>
  withLocalTmpDir(async () => {
    const oldEnv = process.env
    await outputFiles(config.files)
    await execa.command('base prepare')
    const self = stealthyRequire(require.cache, () => require('./nuxt.config'))
    const nuxt = new Nuxt({
      ...self,
      dev: !!config.dev,
      build: { quiet: true },
    })
    await new Builder(nuxt).build()
    await nuxt.listen()
    try {
      await config.test()
    } finally {
      await nuxt.close()
      process.env = oldEnv
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
            <div class="foo">Hello world</div>
          </template>

        `,
      },
      test: async () => {
        await page.goto('http://localhost:3000')
        const handle = await page.waitForSelector('.foo')
        expect(await handle.evaluate(div => div.textContent)).toEqual(
          'Hello world'
        )
      },
    },
    style: {
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
            <div :class="$style.foo">
              Hello world
            </div>
          </template>

          <style lang="scss" module>
          .foo {
            background: red;
          }
          </style>

        `,
      },
      test: async () => {
        await page.goto('http://localhost:3000')
        await new Promise(resolve => setTimeout(resolve, 1000))
        const handle = await page.waitForSelector('._2064edUr8FaER8IUynnErP')
        const backgroundColor = await handle.evaluate(
          el => getComputedStyle(el).backgroundColor
        )
        expect(backgroundColor).toMatch('rgb(255, 0, 0)')
      },
    },
    'style in dev': {
      dev: true,
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
            <div :class="$style.foo">
              Hello world
            </div>
          </template>

          <style lang="scss" module>
          .foo {
            background: red;
          }
          </style>

        `,
      },
      test: async () => {
        await page.goto('http://localhost:3000')
        const handle = await page.waitForSelector('.index__foo')
        const backgroundColor = await handle.evaluate(
          el => getComputedStyle(el).backgroundColor
        )
        expect(backgroundColor).toMatch('rgb(255, 0, 0)')
      },
    },
    'css class casing': {
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
            <div :class="['foo', $style.fooBar]">
              Hello world
            </div>
          </template>

          <style lang="scss" module>
          .foo-bar {
            background: red;
          }
          </style>

        `,
      },
      test: async () => {
        await page.goto('http://localhost:3000')
        const handle = await page.waitForSelector('.foo')
        const backgroundColor = await handle.evaluate(
          el => getComputedStyle(el).backgroundColor
        )
        expect(backgroundColor).toMatch('rgb(255, 0, 0)')
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
            $color: red;
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
        'pages/index.vue': endent`
          <template>
            <div :class="['foo', $style.foo]">
              Hello world
            </div>
          </template>

          <style lang="scss" module>
          @import '~sass-foo';

          .foo {
            background: red;
          }
          </style>

        `,
      },
      test: async () => {
        await page.goto('http://localhost:3000')
        const handle = await page.waitForSelector('.foo')
        const backgroundColor = await handle.evaluate(
          el => getComputedStyle(el).backgroundColor
        )
        expect(backgroundColor).toMatch('rgb(255, 0, 0)')
      },
    },
    'global styles': {
      files: {
        'package.json': JSON.stringify(
          {
            baseConfig: require.resolve('.'),
          },
          undefined,
          2
        ),
        'assets/style.scss': endent`
          .foo {
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
            <div class="foo">Hello world</div>
          </template>

        `,
      },
      test: async () => {
        await page.goto('http://localhost:3000')
        const handle = await page.waitForSelector('.foo')
        const backgroundColor = await handle.evaluate(
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
    'dotenv: module': {
      files: {
        '.env.json': { foo: 'bar' } |> JSON.stringify,
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
    'dotenv: config': {
      files: {
        '.env.json': { foo: 'Bar' } |> JSON.stringify,
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
            name: process.env.FOO,
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
        expect(await page.title()).toEqual('Bar')
      },
    },
    'port foo': {
      files: {
        '.env.json': { port: 3005 } |> JSON.stringify,
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
            <div class="foo">Hello world</div>
          </template>

        `,
      },
      test: async () => {
        await page.goto('http://localhost:3005')
        const handle = await page.waitForSelector('.foo')
        expect(await handle.evaluate(div => div.textContent)).toEqual(
          'Hello world'
        )
        delete process.env.PORT
      },
    },
    api: {
      files: {
        'package.json': JSON.stringify(
          {
            baseConfig: require.resolve('.'),
          },
          undefined,
          2
        ),
        'api/foo.get.js': endent`
          export default (req, res) => res.json({ foo: 'bar' })

        `,
      },
      test: async () => {
        const result =
          axios.get('http://localhost:3000/api/foo')
          |> await
          |> property('data')
        expect(result).toEqual({ foo: 'bar' })
      },
    },
    'raw file': {
      files: {
        'package.json': JSON.stringify(
          {
            baseConfig: require.resolve('.'),
          },
          undefined,
          2
        ),
        'assets/foo.txt': 'Hello world',
        'pages/index.vue': endent`
          <template>
            <div class="foo">{{ foo }}</div>
          </template>

          <script>
          import foo from '@/assets/foo.txt'

          export default {
            computed: {
              foo: () => foo,
            },
          }
          </script>

        `,
      },
      test: async () => {
        await page.goto('http://localhost:3000')
        const handle = await page.waitForSelector('.foo')
        expect(await handle.evaluate(div => div.textContent)).toEqual(
          'Hello world'
        )
      },
    },
    svg: {
      files: {
        'package.json': JSON.stringify(
          {
            baseConfig: require.resolve('.'),
          },
          undefined,
          2
        ),
        'assets/foo.svg': '<svg xmlns="http://www.w3.org/2000/svg" />',
        'pages/index.vue': endent`
          <template>
            <Foo class="svg" />
          </template>

          <script>
          import Foo from '@/assets/foo.svg'

          export default {
            components: {
              Foo,
            },
          }
          </script>

        `,
      },
      test: async () => {
        await page.goto('http://localhost:3000')
        const handle = await page.waitForSelector('.svg')
        expect(await handle.evaluate(foo => foo.tagName)).toEqual('svg')
      },
    },
    aliases: {
      files: {
        'package.json': JSON.stringify(
          {
            baseConfig: require.resolve('.'),
          },
          undefined,
          2
        ),
        'model/foo.js': endent`
          export default 'Hello world'
          
        `,
        'pages/index.vue': endent`
          <template>
            <div class="foo">{{ foo }}</div>
          </template>

          <script>
          import foo from '@/model/foo'

          export default {
            computed: {
              foo: () => foo,
            },
          }
          </script>

        `,
      },
      test: async () => {
        await page.goto('http://localhost:3000')
        const handle = await page.waitForSelector('.foo')
        expect(await handle.evaluate(div => div.textContent)).toEqual(
          'Hello world'
        )
      },
    },
    'global components': {
      files: {
        'package.json': JSON.stringify(
          {
            baseConfig: require.resolve('.'),
          },
          undefined,
          2
        ),
        'components/foo.global.vue': endent`
          <template>
            <div class="foo">Hello world</div>
          </template>
          
        `,
        'pages/index.vue': endent`
          <template>
            <foo />
          </template>

        `,
      },
      test: async () => {
        await page.goto('http://localhost:3000')
        const handle = await page.waitForSelector('.foo')
        expect(await handle.evaluate(div => div.textContent)).toEqual(
          'Hello world'
        )
      },
    },
    i18n: {
      files: {
        'i18n/en.json': JSON.stringify(
          {
            foo: 'Hello world',
          },
          undefined,
          2
        ),
        'package.json': JSON.stringify(
          {
            baseConfig: require.resolve('.'),
          },
          undefined,
          2
        ),
        'pages/index.vue': endent`
          <template>
            <div class="foo">{{ $t('foo') }}</div>
          </template>

        `,
      },
      test: async () => {
        await page.goto('http://localhost:3000')
        const handle = await page.waitForSelector('.foo')
        expect(await handle.evaluate(div => div.textContent)).toEqual(
          'Hello world'
        )
      },
    },
    'request body': {
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
            <div class="foo">{{ foo }}</div>
          </template>

          <script>
          export default {
            asyncData: context => ({ foo: context.req.body.foo }),
          }
          </script>

        `,
      },
      test: async () => {
        await page.setRequestInterception(true)
        page.once('request', request => {
          request.continue({
            method: 'POST',
            postData: JSON.stringify({ foo: 'bar' }),
            headers: { 'Content-Type': 'application/json' },
          })
          return page.setRequestInterception(false)
        })
        await page.goto('http://localhost:3000')
        const handle = await page.waitForSelector('.foo')
        expect(await handle.evaluate(div => div.textContent)).toEqual('bar')
      },
    },
    'locale link': {
      files: {
        'i18n/en.json': JSON.stringify({}, undefined, 2),
        'package.json': JSON.stringify(
          {
            baseConfig: require.resolve('.'),
          },
          undefined,
          2
        ),
        pages: {
          'foo.vue': endent`
            <template>
              <div />
            </template>

          `,
          'index.vue': endent`
            <template>
              <nuxt-locale-link :to="{ name: 'foo' }">
                foo
              </nuxt-locale-link>
            </template>

          `,
        },
      },
      test: async () => {
        await page.goto('http://localhost:3000')
        expect(await page.$eval('a', a => a.getAttribute('href'))).toEqual(
          '/en/foo'
        )
      },
    },
    'i18n: middleware': {
      files: {
        i18n: {
          'de.json': JSON.stringify({}, undefined, 2),
          'en.json': JSON.stringify({}, undefined, 2),
        },
        'middleware/foo.js': endent`
          export default () => {}
          
        `,
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
              middleware: ['foo']
            }
          }

        `,
        pages: {
          'index.vue': endent`
            <template>
              <div class="foo">Hello world</div>
            </template>

          `,
        },
      },
      test: async () => {
        await page.goto('http://localhost:3000')
        console.log(await page.content())
        const handle = await page.waitForSelector('.foo')
        expect(await handle.evaluate(div => div.textContent)).toEqual(
          'Hello world'
        )
      },
    },
  } |> mapValues(runTest)),
}
