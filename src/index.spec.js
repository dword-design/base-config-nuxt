import { Base } from '@dword-design/base'
import { endent, endsWith, property } from '@dword-design/functions'
import tester from '@dword-design/tester'
import testerPluginPuppeteer from '@dword-design/tester-plugin-puppeteer'
import testerPluginTmpDir from '@dword-design/tester-plugin-tmp-dir'
import { buildNuxt, loadNuxt } from '@nuxt/kit'
import axios from 'axios'
import packageName from 'depcheck-package-name'
import { execaCommand } from 'execa'
import outputFiles from 'output-files'
import P from 'path'
import kill from 'tree-kill-promise'
import waitPort from 'wait-port'
import xmlFormatter from 'xml-formatter'
import testerPluginEnv from '@dword-design/tester-plugin-env'

import config from './index.js'

export default tester(
  {
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
      async test() {
        await this.page.goto('http://localhost:3000')

        const handle = await this.page.waitForSelector('.foo')
        expect(await handle.evaluate(div => div.textContent)).toEqual(
          'Hello world',
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
    'api body': {
      files: {
        'api/foo.post.js': endent`
          export default (req, res) => res.json(req.body)

        `,
      },
      test: async () => {
        const result =
          axios.post('http://localhost:3000/api/foo', { foo: 'bar' })
          |> await
          |> property('data')
        expect(result).toEqual({ foo: 'bar' })
      },
    },
    'async modules': {
      files: {
        'config.js': endent`
          export default {
            modules: [
              './modules/foo',
            ]
          }
        `,
        'modules/foo': {
          'index.js': endent`
            import { delay } from '@dword-design/functions'
            import { addPlugin, createResolver } from '@nuxt/kit'

            const resolver = createResolver(import.meta.url)

            export default async function () {
              await delay(100)
              addPlugin(resolver.resolve('./plugin'), { append: true })
            }
          `,
          'plugin.js':
            "export default defineNuxtPlugin(() => ({ provide: { foo: 'Hello world' } }))",
        },
        'pages/index.vue': endent`
          <template>
            <div class="foo">{{ $foo }}</div>
          </template>

          <script setup>
          const { $foo } = useNuxtApp()
          </script>

        `,
      },
      async test() {
        await this.page.goto('http://localhost:3000')

        const foo = await this.page.waitForSelector('.foo')
        expect(await foo.evaluate(el => el.innerText)).toEqual('Hello world')
      },
    },
    'basic auth': {
      files: {
        '.env.schema.json':
          {
            basicAuthPassword: { type: 'string' },
            basicAuthUser: { type: 'string' },
          } |> JSON.stringify,
        '.test.env.json':
          { basicAuthPassword: 'bar', basicAuthUser: 'foo' } |> JSON.stringify,
        'api/foo.get.js': endent`
          export default (req, res) => res.send('foo')

        `,
        'pages/index.vue': endent`
          <template>
            <div />
          </template>

        `,
      },
      test: async () => {
        await expect(axios.get('http://localhost:3000')).rejects.toHaveProperty(
          'response.status',
          401,
        )
        await expect(
          axios.get('http://localhost:3000/api/foo'),
        ).rejects.toHaveProperty('response.status', 401)
        await Promise.all([
          axios.get('http://localhost:3000', {
            auth: {
              password: 'bar',
              username: 'foo',
            },
          }),
          axios.get('http://localhost:3000/api/foo', {
            auth: {
              password: 'bar',
              username: 'foo',
            },
          }),
        ])
      },
    },
    bodyAttrs: {
      files: {
        'config.js': endent`
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
      async test() {
        await this.page.goto('http://localhost:3000')
        expect(await this.page.$eval('body', el => el.className)).toEqual(
          'foo bar',
        )
      },
    },
    css: {
      files: {
        'assets/style.scss': endent`
          .foo {
            background: red;
          }
        `,
        'config.js': endent`
          export default {
            css: [
              '@/assets/style.scss',
            ],
          }
        `,
        'pages/index.vue': endent`
          <template>
            <div class="foo">Hello world</div>
          </template>

        `,
      },
      async test() {
        await this.page.goto('http://localhost:3000')

        const handle = await this.page.waitForSelector('.foo')

        const backgroundColor = await handle.evaluate(
          el => getComputedStyle(el).backgroundColor,
        )
        expect(backgroundColor).toMatch('rgb(255, 0, 0)')
      },
    },
    'dotenv: config': {
      files: {
        '.env.schema.json': { foo: { type: 'string' } } |> JSON.stringify,
        '.test.env.json': { foo: 'Bar' } |> JSON.stringify,
        'config.js': endent`
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
      async test() {
        await this.page.goto('http://localhost:3000')
        expect(await this.page.title()).toEqual('Bar')
      },
    },
    'dotenv: module': {
      files: {
        '.env.schema.json': { foo: { type: 'string' } } |> JSON.stringify,
        '.test.env.json': { foo: 'bar' } |> JSON.stringify,
        'config.js': endent`
          export default {
            modules: [
              './modules/foo',
            ],
          }
        `,
        'modules/foo.js': endent`
          export default function () {
            expect(process.env.FOO).toEqual('bar')
          }
        `,
        'pages/index.vue': endent`
          <template>
            <div>Hello world</div>
          </template>

        `,
      },
    },
    'error page': {
      files: {
        'layouts/default.vue': endent`
          <template>
            <div>
              <nuxt />
              <div>Footer</div>
            </div>
          </template>

        `,
        'pages/index.vue': endent`
          <template>
            <div />
          </template>

        `,
      },
      async test() {
        await this.page.goto('http://localhost:3000/foo')
        await this.page.waitForSelector('.__nuxt-error-page')
        expect(await this.page.screenshot()).toMatchImageSnapshot(this)
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
      async test() {
        await this.page.goto('http://localhost:3000')

        const handle = await this.page.waitForSelector('.foo')
        expect(await handle.evaluate(div => div.textContent)).toEqual(
          'Hello world',
        )
      },
    },
    'head in module': {
      files: {
        'config.js': endent`
          export default {
            modules: [
              './modules/mod',
            ]
          }

        `,
        'modules/mod.js': endent`
          export default function () {
            this.options.head.script.push('foo')
          }

        `,
      },
    },
    'head link': {
      files: {
        'config.js': endent`
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
      async test() {
        await this.page.goto('http://localhost:3000')

        const link = await this.page.waitForSelector('link[rel=alternate]')
        expect(
          await Promise.all([
            link.evaluate(el => el.getAttribute('rel')),
            link.evaluate(el => el.getAttribute('type')),
            link.evaluate(el => el.getAttribute('title')),
            link.evaluate(el => el.getAttribute('href')),
          ]),
        ).toEqual(['alternate', 'application/rss+xml', 'Blog', '/feed'])
      },
    },
    headAttrs: {
      files: {
        'config.js': endent`
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
      async test() {
        await this.page.goto('http://localhost:3000')
        expect(await this.page.$eval('head', el => el.className)).toEqual(
          'foo bar',
        )
      },
    },
    hexrgba: {
      files: {
        'assets/style.css': endent`
          body {
            background: rgba(#fff, .5);
          }
        `,
        'config.js': endent`
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
      async test() {
        await this.page.goto('http://localhost:3000')

        const backgroundColor = await this.page.$eval(
          'body',
          el => getComputedStyle(el).backgroundColor,
        )
        expect(backgroundColor).toEqual('rgba(0, 0, 0, 0)')
      },
    },
    htmlAttrs: {
      files: {
        'config.js': endent`
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
      async test() {
        await this.page.goto('http://localhost:3000')
        expect(await this.page.$eval('html', el => el.className)).toEqual(
          'foo bar',
        )
      },
    },
    'i18n: browser language changed': {
      files: {
        i18n: {
          'de.json': JSON.stringify({}, undefined, 2),
          'en.json': JSON.stringify({}, undefined, 2),
        },
        'layouts/default.vue': endent`
          <template>
            <nuxt />
          </template>

          <script>
          export default {
            head () {
              return this.$nuxtI18nHead({ addSeoAttributes: true })
            }
          }
          </script>

        `,
        'pages/index.vue': endent`
          <template>
            <div />
          </template>

        `,
      },
      async test() {
        await this.page.goto('http://localhost:3000')
        expect(await this.page.url()).toEqual('http://localhost:3000/en')
        await this.page.setExtraHTTPHeaders({
          'Accept-Language': 'de',
        })
        await this.page.goto('http://localhost:3000')
        expect(await this.page.url()).toEqual('http://localhost:3000/de')
      },
    },
    'i18n: jsx in layout': {
      files: {
        i18n: {
          'de.json': JSON.stringify({}, undefined, 2),
          'en.json': JSON.stringify({}, undefined, 2),
        },
        'layouts/default.vue': endent`
          <script>
          export default {
            head () {
              return this.$nuxtI18nHead({ addSeoAttributes: true })
            },
            render: () => <nuxt />,
          }
          </script>
  
        `,
      },
    },
    'i18n: middleware': {
      files: {
        'config.js': endent`
          export default {
            router: {
              middleware: ['foo']
            }
          }

        `,
        i18n: {
          'de.json': JSON.stringify({}, undefined, 2),
          'en.json': JSON.stringify({}, undefined, 2),
        },
        'layouts/default.vue': endent`
          <template>
            <nuxt />
          </template>

          <script>
          export default {
            head () {
              return this.$nuxtI18nHead({ addSeoAttributes: true })
            }
          }
          </script>

        `,
        'middleware/foo.js': endent`
          export default () => {}

        `,
        'pages/index.vue': endent`
          <template>
            <div class="foo">Hello world</div>
          </template>

        `,
      },
      async test() {
        await this.page.goto('http://localhost:3000')

        const handle = await this.page.waitForSelector('.foo')
        expect(await handle.evaluate(div => div.textContent)).toEqual(
          'Hello world',
        )
      },
    },
    'i18n: no $nuxtI18nHead in default layout': {
      error: endent`
        You have to implement $nuxtI18nHead in ${P.join(
          'layouts',
          'default.vue',
        )} like this to make sure that i18n metadata are generated:

        <script>
        export default {
          head () {
            return this.$nuxtI18nHead({ addSeoAttributes: true })
          }
        }
        </script>
      `,
      files: {
        i18n: {
          'de.json': JSON.stringify({ foo: 'Hallo Welt' }),
          'en.json': JSON.stringify({ foo: 'Hello world' }),
        },
        'layouts/default.vue': endent`
          <script>
            export default {}
          </script>

        `,
      },
    },
    'i18n: no $nuxtI18nHead in non-default layout': {
      error: endent`
        You have to implement $nuxtI18nHead in ${P.join(
          'layouts',
          'foo.vue',
        )} like this to make sure that i18n metadata are generated:

        <script>
        export default {
          head () {
            return this.$nuxtI18nHead({ addSeoAttributes: true })
          }
        }
        </script>
      `,
      files: {
        i18n: {
          'de.json': JSON.stringify({ foo: 'Hallo Welt' }),
          'en.json': JSON.stringify({ foo: 'Hello world' }),
        },
        layouts: {
          'default.vue': endent`
            <template>
              <nuxt />
            </template>

            <script>
            export default {
              head () {
                return this.$nuxtI18nHead({ addSeoAttributes: true })
              }
            }
            </script>

          `,
          'foo.vue': endent`
            <script>
              export default {}
            </script>

          `,
        },
      },
    },
    'i18n: no layout': {
      error: endent`
        You have to implement $nuxtI18nHead in ${P.join(
          'layouts',
          'default.vue',
        )} like this to make sure that i18n metadata are generated:

        <script>
        export default {
          head () {
            return this.$nuxtI18nHead({ addSeoAttributes: true })
          }
        }
        </script>
      `,
      files: {
        i18n: {
          'de.json': JSON.stringify({ foo: 'Hallo Welt' }),
          'en.json': JSON.stringify({ foo: 'Hello world' }),
        },
      },
    },
    'i18n: non-layout file in layouts': {
      files: {
        i18n: {
          'de.json': JSON.stringify({ foo: 'Hallo Welt' }),
          'en.json': JSON.stringify({ foo: 'Hello world' }),
        },
        layouts: {
          '-foo.vue': '',
          'default.vue': endent`
            <template>
              <nuxt />
            </template>

            <script>
            export default {
              head () {
                return this.$nuxtI18nHead({ addSeoAttributes: true })
              }
            }
            </script>

          `,
        },
      },
    },
    'i18n: root with prefix': {
      files: {
        i18n: {
          'de.json': JSON.stringify({}, undefined, 2),
          'en.json': JSON.stringify({}, undefined, 2),
        },
        'layouts/default.vue': endent`
          <template>
            <nuxt />
          </template>

          <script>
          export default {
            head () {
              return this.$nuxtI18nHead({ addSeoAttributes: true })
            }
          }
          </script>

        `,
        'pages/index.vue': endent`
          <template>
            <div />
          </template>

        `,
      },
      async test() {
        await this.page.goto('http://localhost:3000/de')
        expect(await this.page.url()).toEqual('http://localhost:3000/de')
      },
    },
    'i18n: root without prefix': {
      files: {
        i18n: {
          'de.json': JSON.stringify({}, undefined, 2),
          'en.json': JSON.stringify({}, undefined, 2),
        },
        'layouts/default.vue': endent`
          <template>
            <nuxt />
          </template>

          <script>
          export default {
            head () {
              return this.$nuxtI18nHead({ addSeoAttributes: true })
            }
          }
          </script>

        `,
        'pages/index.vue': endent`
          <template>
            <div />
          </template>

        `,
      },
      async test() {
        await this.page.setExtraHTTPHeaders({
          'Accept-Language': 'de',
        })
        await this.page.goto('http://localhost:3000')
        expect(await this.page.url()).toEqual('http://localhost:3000/de')
      },
    },
    'i18n: route with prefix': {
      files: {
        i18n: {
          'de.json': JSON.stringify({}, undefined, 2),
          'en.json': JSON.stringify({}, undefined, 2),
        },
        'layouts/default.vue': endent`
          <template>
            <nuxt />
          </template>

          <script>
          export default {
            head () {
              return this.$nuxtI18nHead({ addSeoAttributes: true })
            }
          }
          </script>

        `,
        'pages/foo.vue': endent`
          <template>
            <div />
          </template>

        `,
      },
      async test() {
        await this.page.goto('http://localhost:3000/de/foo')
        expect(await this.page.url()).toEqual('http://localhost:3000/de/foo')
      },
    },
    'i18n: route without prefix': {
      files: {
        i18n: {
          'de.json': JSON.stringify({}, undefined, 2),
          'en.json': JSON.stringify({}, undefined, 2),
        },
        'layouts/default.vue': endent`
          <template>
            <nuxt />
          </template>

          <script>
          export default {
            head () {
              return this.$nuxtI18nHead({ addSeoAttributes: true })
            }
          }
          </script>

        `,
        'pages/foo.vue': endent`
          <template>
            <div />
          </template>

        `,
      },
      async test() {
        await this.page.setExtraHTTPHeaders({
          'Accept-Language': 'de',
        })
        await this.page.goto('http://localhost:3000/foo')
        expect(await this.page.url()).toEqual('http://localhost:3000/de/foo')
      },
    },
    'i18n: single locale': {
      files: {
        'i18n/de.json': JSON.stringify({ foo: 'bar' }),
        'layouts/default.vue': endent`
          <template>
            <nuxt />
          </template>

          <script>
          export default {
            head () {
              return this.$nuxtI18nHead({ addSeoAttributes: true })
            }
          }
          </script>

        `,
        pages: {
          'bar.vue': endent`
            <template>
              <div class="bar" />
            </template>
          `,
          'index.vue': endent`
            <template>
              <a :href="$router.resolve('bar').href" class="foo">{{ $t('foo') }}</a>
            </template>
          `,
        },
      },
      async test() {
        await this.page.setExtraHTTPHeaders({
          'Accept-Language': 'en',
        })
        await this.page.goto('http://localhost:3000')
        expect(await this.page.url()).toEqual('http://localhost:3000/')

        const link = await this.page.waitForSelector('.foo')
        expect(await link.evaluate(el => el.textContent)).toEqual('bar')
        await link.click()
        await this.page.waitForNavigation()
        expect(await this.page.url()).toEqual('http://localhost:3000/bar')
        await this.page.waitForSelector('.bar')
      },
    },
    'i18n: works': {
      files: {
        '.env.schema.json': { baseUrl: { type: 'string' } } |> JSON.stringify,
        '.test.env.json':
          { baseUrl: 'http://localhost:3000' } |> JSON.stringify,
        'config.js': endent`
          export default {
            htmlAttrs: { style: 'background: red' },
            head: {
              link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
            },
          }
        `,
        i18n: {
          'de.json': JSON.stringify({ foo: 'Hallo Welt' }),
          'en.json': JSON.stringify({ foo: 'Hello world' }),
        },
        'pages/index.vue': endent`
          <template>
            <div class="foo">{{ $t('foo') }}</div>
          </template>
        `,
      },
      async test() {
        // The meta tags were there but `this.$nuxtI18nHead was undefined client-side, which lead to follow-up problems.
        // Make sure that there are no client-side script errors related to @nuxtjs/i18n.
        let error
        this.page.on('console', message => {
          if (message.type() === 'error') {
            error = message.text()
          }
        })
        await this.page.goto('http://localhost:3000')

        const handle = await this.page.waitForSelector('.foo')
        expect(await handle.evaluate(div => div.textContent)).toEqual(
          'Hello world',
        )

        const html = await this.page.waitForSelector('html[lang=en]')
        await this.page.waitForSelector(
          'link[rel=alternate][href="http://localhost:3000/de"][hreflang=de]',
        )
        await this.page.waitForSelector(
          'link[rel=alternate][href="http://localhost:3000/en"][hreflang=en]',
        )
        expect(await html.evaluate(el => el.getAttribute('style'))).toEqual(
          'background: red',
        )
        await this.page.waitForSelector(
          'link[rel=icon][type="image/x-icon"][href="/favicon.ico"]',
        )
        expect(error).toBeUndefined()
      },
    },
    'locale link': {
      files: {
        i18n: {
          'de.json': JSON.stringify({}),
          'en.json': JSON.stringify({}),
        },
        'layouts/default.vue': endent`
          <template>
            <nuxt />
          </template>

          <script>
          export default {
            head () {
              return this.$nuxtI18nHead({ addSeoAttributes: true })
            }
          }
          </script>

        `,
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
      async test() {
        await this.page.goto('http://localhost:3000')
        expect(await this.page.$eval('a', a => a.getAttribute('href'))).toEqual(
          '/en/foo',
        )
      },
    },
    name: {
      files: {
        'config.js': endent`
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
      async test() {
        await this.page.goto('http://localhost:3000')
        expect(await this.page.title()).toEqual('Test-App')
      },
    },
    'name and title': {
      files: {
        'config.js': endent`
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
      async test() {
        await this.page.goto('http://localhost:3000')
        expect(await this.page.title()).toEqual(
          'Test-App: This is the ultimate app!',
        )
      },
    },
    'page with title': {
      files: {
        'config.js': endent`
          export default {
            name: 'Test-App',
            title: 'This is the ultimate app!',
          }
        `,
        'pages/foo.vue': endent`
          <template>
            <div>Hello world</div>
          </template>

          <script setup>
          useHead({ title: 'Foo page' })
          </script>

        `,
      },
      async test() {
        await this.page.goto('http://localhost:3000/foo')
        expect(await this.page.title()).toEqual('Foo page | Test-App')
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
      async test() {
        await this.page.goto('http://localhost:3005')

        const handle = await this.page.waitForSelector('.foo')
        expect(await handle.evaluate(div => div.textContent)).toEqual(
          'Hello world',
        )
        delete process.env.PORT
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
      async test() {
        await this.page.goto('http://localhost:3000')

        const handle = await this.page.waitForSelector('.foo')
        expect(await handle.evaluate(div => div.textContent)).toEqual(
          'Hello world',
        )
      },
    },
    'request body': {
      files: {
        'pages/index.vue': endent`
          <template>
            <form method="POST" :class="{ sent }">
              <button name="submit" type="submit" @submit="send">Send</button>
            </form>
          </template>

          <script>
          export default {
            asyncData: context => ({ sent: context.req.body.submit !== undefined }),
          }
          </script>

        `,
      },
      async test() {
        await this.page.goto('http://localhost:3000')

        const button = await this.page.waitForSelector('button')
        await button.click()
        await this.page.waitForSelector('form.sent')
      },
    },
    'router config': {
      files: {
        'config.js': endent`
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
      async test() {
        await this.page.goto('http://localhost:3000')
        expect(
          await this.page.$eval('.home.is-active', el => el.textContent),
        ).toMatch('Home')
      },
    },
    'setup-express.js': {
      files: {
        'api/foo.get.js': endent`
          export default (req, res) => res.json({ foo: 'bar' })
        `,
        'setup-express.js': endent`
          export default app => app.use((req, res, next) => { req.foo = 'bar'; next() })
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
    sitemap: {
      files: {
        'config.js': endent`
          export default {
            modules: [
              '${packageName`@nuxtjs/sitemap`}',
            ]
          }

        `,
        i18n: {
          'de.json': JSON.stringify({}),
          'en.json': JSON.stringify({}),
        },
        'layouts/default.vue': endent`
          <template>
            <nuxt />
          </template>

          <script>
          export default {
            head () {
              return this.$nuxtI18nHead({ addSeoAttributes: true })
            }
          }
          </script>

        `,
        'page/index.vue': endent`
          <template>
            <div class="foo">Hello world</div>
          </template>

        `,
      },
      async test() {
        const response = await this.page.goto(
          'http://localhost:3000/sitemap.xml',
        )
        expect(
          xmlFormatter(response.text() |> await, {
            collapseContent: true,
            indentation: '  ',
            lineSeparator: '\n',
          }),
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
      async test() {
        await this.page.goto('http://localhost:3000')

        const handle = await this.page.waitForSelector('.svg')
        expect(await handle.evaluate(foo => foo.tagName)).toEqual('svg')
      },
    },
    userScalable: {
      files: {
        'config.js': endent`
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
      async test() {
        await this.page.goto('http://localhost:3000')

        const handle = await this.page.waitForSelector('meta[name=viewport]')
        expect(
          (await handle.evaluate(meta => meta.content))
            |> endsWith('user-scalable=0'),
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
      async test() {
        await this.page.goto('http://localhost:3000')

        const handle = await this.page.waitForSelector('.foo')
        expect(await handle.evaluate(div => div.textContent)).toEqual(
          'Hello world',
        )
      },
    },
  },
  [
    testerPluginEnv(),
    testerPluginPuppeteer(),
    {
      transform: test => {
        test = { test: () => {}, ...test }

        return async function () {
          await outputFiles(test.files)
          await new Base(config).prepare()

          const nuxt = await loadNuxt({
            config: {
              vite: { logLevel: 'error' },
              telemetry: false,
            },
          })
          if (test.error) {
            await expect(buildNuxt(nuxt)).rejects.toThrow(test.error)
          } else {
            await buildNuxt(nuxt)

            const childProcess = execaCommand('nuxt start')
            await waitPort({ output: 'silent', port: 3000 })
            try {
              await test.test.call(this)
            } finally {
              await kill(childProcess.pid)
            }
          }
        }
      },
    },
    testerPluginTmpDir(),
  ],
)
