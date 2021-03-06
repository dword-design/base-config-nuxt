import { endent, endsWith, mapValues, property } from '@dword-design/functions'
import puppeteer from '@dword-design/puppeteer'
import axios from 'axios'
import packageName from 'depcheck-package-name'
import execa from 'execa'
import { exists } from 'fs-extra'
import { Builder, Nuxt } from 'nuxt'
import outputFiles from 'output-files'
import stealthyRequire from 'stealthy-require-no-leak'
import withLocalTmpDir from 'with-local-tmp-dir'
import xmlFormatter from 'xml-formatter'

let browser
let page

const runTest = config => () =>
  withLocalTmpDir(async () => {
    const oldEnv = process.env
    await outputFiles({
      'node_modules/base-config-self/index.js':
        "module.exports = require('../../../src')",
      'package.json': JSON.stringify(
        {
          baseConfig: 'self',
        },
        undefined,
        2
      ),
      ...config.files,
    })
    await execa.command('base prepare')

    const self = stealthyRequire(require.cache, () => require('./nuxt.config'))

    const nuxt = new Nuxt({ ...self, dev: !!config.dev })
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
  after: () => browser.close(),
  before: async () => {
    browser = await puppeteer.launch()
    page = await browser.newPage()
  },
  ...({
    aliases: {
      files: {
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
    api: {
      files: {
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
    'async modules': {
      files: {
        'modules/foo': {
          'index.js': endent`
            import { delay } from '@dword-design/functions'
            
            export default async function () {
              await delay(100)
              this.addPlugin(require.resolve('./plugin'))
            }
          `,
          'plugin.js':
            "export default (context, inject) => inject('foo', 'Hello world')",
        },
        'nuxt.config.js': endent`
          export default {
            modules: [
              '~/modules/foo',
            ]
          }
        `,
        'pages/index.vue': endent`
          <template>
            <div class="foo">{{ foo }}</div>
          </template>

          <script>
          export default {
            asyncData: context => ({
              foo: context.$foo,
            }),
          }
          </script>

        `,
      },
      test: async () => {
        await page.goto('http://localhost:3000')

        const foo = await page.waitForSelector('.foo')
        expect(await foo.evaluate(el => el.innerText)).toEqual('Hello world')
      },
    },
    bodyAttrs: {
      files: {
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
    'css class casing': {
      files: {
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
    'dotenv: config': {
      files: {
        '.env.schema.json': { foo: { type: 'string' } } |> JSON.stringify,
        '.test.env.json': { foo: 'Bar' } |> JSON.stringify,
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
    'dotenv: module': {
      files: {
        '.env.schema.json': { foo: { type: 'string' } } |> JSON.stringify,
        '.test.env.json': { foo: 'bar' } |> JSON.stringify,
        'modules/foo.js': endent`
          export default function () {
            this.options.head.titleTemplate = process.env.FOO
          }
        `,
        'nuxt.config.js': endent`
          export default {
            modules: [
              'modules/foo',
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
        expect(await page.title()).toEqual('bar')
      },
    },
    'global components': {
      files: {
        'components/foo.vue': endent`
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
    'global styles': {
      files: {
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
    'head link': {
      files: {
        'nuxt.config.js': endent`
          export default {
            head: {
              link: [
                { rel: 'alternate', type: 'application/rss+xml', title: 'Blog', href: '/feed' }
              ]
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

        const link = await page.waitForSelector('link[rel=alternate]')
        expect(
          await Promise.all([
            link.evaluate(el => el.getAttribute('rel')),
            link.evaluate(el => el.getAttribute('type')),
            link.evaluate(el => el.getAttribute('title')),
            link.evaluate(el => el.getAttribute('href')),
          ])
        ).toEqual(['alternate', 'application/rss+xml', 'Blog', '/feed'])
      },
    },
    headAttrs: {
      files: {
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
    hexrgba: {
      files: {
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
    hooks: {
      files: {
        'nuxt.config.js': endent`
          import { outputFile } from 'fs-extra'
          
          export default {
            hooks: {
              'build:done': () => outputFile('build-done.txt', '')
            },
          }
        `,
      },
      test: async () => expect(await exists('build-done.txt')).toBeTruthy(),
    },
    htmlAttrs: {
      files: {
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
    i18n: {
      files: {
        'i18n/en.json': JSON.stringify(
          {
            foo: 'Hello world',
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
    'i18n: middleware': {
      files: {
        i18n: {
          'de.json': JSON.stringify({}, undefined, 2),
          'en.json': JSON.stringify({}, undefined, 2),
        },
        'middleware/foo.js': endent`
          export default () => {}

        `,
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

        const handle = await page.waitForSelector('.foo')
        expect(await handle.evaluate(div => div.textContent)).toEqual(
          'Hello world'
        )
      },
    },
    'locale link': {
      files: {
        'i18n/en.json': JSON.stringify({}, undefined, 2),
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
    name: {
      files: {
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
          'Test-App: This is the ultimate app!'
        )
      },
    },
    'page with title': {
      files: {
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
              title: 'Foo page',
            },
          }
          </script>

        `,
      },
      test: async () => {
        await page.goto('http://localhost:3000/foo')
        expect(await page.title()).toEqual('Foo page | Test-App')
      },
    },
    port: {
      files: {
        '.env.schema.json': { port: { type: 'integer' } } |> JSON.stringify,
        '.test.env.json': { port: 3005 } |> JSON.stringify,
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
    'postcss plugin': {
      files: {
        'assets/style.css': endent`
          body {
            background: rgba(#fff, .5);
          }
        `,
        'nuxt.config.js': endent`
          export default {
            css: ['assets/style.css'],
            postcssPlugins: {
              '${packageName`postcss-hexrgba`}': {},
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
    'raw file': {
      files: {
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
    'request body': {
      files: {
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
            headers: { 'Content-Type': 'application/json' },
            method: 'POST',
            postData: JSON.stringify({ foo: 'bar' }),
          })

          return page.setRequestInterception(false)
        })
        await page.goto('http://localhost:3000')

        const handle = await page.waitForSelector('.foo')
        expect(await handle.evaluate(div => div.textContent)).toEqual('bar')
      },
    },
    'router config': {
      files: {
        'nuxt.config.js': endent`
          export default {
            router: {
              linkActiveClass: 'is-active',
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
        await page.goto('http://localhost:3000')
        expect(
          await page.$eval('.home.is-active', el => el.textContent)
        ).toMatch('Home')
      },
    },
    'sass import': {
      files: {
        'node_modules/sass-foo': {
          'index.scss': endent`
            $color: red;
          `,
          'package.json': endent`
            {
              "main": "index.scss"
            }
          `,
        },
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
    sitemap: {
      files: {
        i18n: {
          'de.json': JSON.stringify({}, undefined, 2),
          'en.json': JSON.stringify({}, undefined, 2),
        },
        'nuxt.config.js': endent`
          export default {
            modules: [
              '${packageName`@nuxtjs/sitemap`}',
            ]
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
        const response = await page.goto('http://localhost:3000/sitemap.xml')
        expect(
          xmlFormatter(response.text() |> await, {
            collapseContent: true,
            indentation: '  ',
            lineSeparator: '\n',
          })
        ).toEqual(endent`
          <?xml version="1.0" encoding="UTF-8"?>
          <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
            <url>
              <loc>http://localhost:3000/de</loc>
            </url>
            <url>
              <loc>http://localhost:3000/en</loc>
            </url>
          </urlset>
        `)
      },
    },
    style: {
      files: {
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

        const handle = await page.waitForSelector('._76xd7v-o5SCrB2-x8wCOe')

        const backgroundColor = await handle.evaluate(
          el => getComputedStyle(el).backgroundColor
        )
        expect(backgroundColor).toMatch('rgb(255, 0, 0)')
      },
    },
    'style in dev': {
      dev: true,
      files: {
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
    svg: {
      files: {
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
    userScalable: {
      files: {
        'nuxt.config.js': endent`
          export default {
            userScalable: false,
          }

        `,
        pages: {
          'index.vue': endent`
            <template>
              <div />
            </template>

          `,
        },
      },
      test: async () => {
        await page.goto('http://localhost:3000')

        const handle = await page.waitForSelector('meta[name=viewport]')
        expect(
          (await handle.evaluate(meta => meta.content))
            |> endsWith('user-scalable=0')
        ).toBeTruthy()
      },
    },
    valid: {
      files: {
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
  } |> mapValues(runTest)),
}
