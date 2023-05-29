import { Base } from '@dword-design/base'
import { endent, property } from '@dword-design/functions'
import tester from '@dword-design/tester'
import testerPluginPuppeteer from '@dword-design/tester-plugin-puppeteer'
import testerPluginTmpDir from '@dword-design/tester-plugin-tmp-dir'
import axios from 'axios'
import packageName from 'depcheck-package-name'
import fs from 'fs-extra'
import nuxtDevReady from 'nuxt-dev-ready'
import outputFiles from 'output-files'
import kill from 'tree-kill-promise'
import xmlFormatter from 'xml-formatter'

import self from './index.js'

export default tester(
  {
    async aliases() {
      await outputFiles({
        'model/foo.js': "export default 'Hello world'",
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
      })

      const base = new Base(self)
      await base.prepare()

      const childProcess = base.run('dev')
      try {
        await nuxtDevReady()
        await this.page.goto('http://localhost:3000')

        const handle = await this.page.waitForSelector('.foo')
        expect(await handle.evaluate(div => div.textContent)).toEqual(
          'Hello world',
        )
      } finally {
        await kill(childProcess.pid)
      }
    },
    api: async () => {
      await fs.outputFile(
        'server/api/foo.get.js',
        endent`
          import { defineEventHandler } from '#imports'

          export default defineEventHandler(() => ({ foo: 'bar' }))
        `,
      )

      const base = new Base(self)
      await base.prepare()

      const childProcess = base.run('dev')
      try {
        await nuxtDevReady()

        const result =
          axios.get('http://localhost:3000/api/foo')
          |> await
          |> property('data')
        expect(result).toEqual({ foo: 'bar' })
      } finally {
        await kill(childProcess.pid)
      }
    },
    async 'async modules'() {
      await outputFiles({
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
      })

      const base = new Base(self)
      await base.prepare()

      const childProcess = base.run('dev')
      try {
        await nuxtDevReady()
        await this.page.goto('http://localhost:3000')

        const foo = await this.page.waitForSelector('.foo')
        expect(await foo.evaluate(el => el.innerText)).toEqual('Hello world')
      } finally {
        await kill(childProcess.pid)
      }
    },
    'babel in api': async () => {
      await fs.outputFile(
        'server/api/foo.get.js',
        endent`
          import { defineEventHandler } from '#imports'

          export default defineEventHandler(() => 1 |> x => x * 2)
        `,
      )

      const base = new Base(self)
      await base.prepare()

      const childProcess = base.run('dev')
      try {
        await nuxtDevReady()

        const result =
          axios.get('http://localhost:3000/api/foo')
          |> await
          |> property('data')
        expect(result).toEqual(2)
      } finally {
        await kill(childProcess.pid)
      }
    },
    'basic auth': async () => {
      await outputFiles({
        '.env.schema.json': JSON.stringify({
          basicAuthPassword: { type: 'string' },
          basicAuthUser: { type: 'string' },
        }),
        '.test.env.json': JSON.stringify({
          basicAuthPassword: 'bar',
          basicAuthUser: 'foo',
        }),
        'package.json': JSON.stringify({ dependencies: { h3: '*' } }),
        'pages/index.vue': endent`
          <template>
            <div />
          </template>
        `,
        'server/api/foo.get.js': endent`
          import { defineEventHandler } from 'h3'

          export default defineEventHandler(() => ('foo'))
        `,
      })

      const base = new Base(self)
      await base.prepare()

      const childProcess = base.run('dev')
      try {
        await nuxtDevReady()
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
      } finally {
        await kill(childProcess.pid)
      }
    },
    async bodyAttrs() {
      await outputFiles({
        'config.js': endent`
          export default {
            bodyAttrs: {
              class: 'foo',
            },
          }
        `,
        'pages/index.vue': endent`
          <template>
            <div>Hello world</div>
          </template>

        `,
      })

      const base = new Base(self)
      await base.prepare()

      const childProcess = base.run('dev')
      try {
        await nuxtDevReady()
        await this.page.goto('http://localhost:3000')
        await this.page.waitForSelector('body.foo')
      } finally {
        await kill(childProcess.pid)
      }
    },
    async css() {
      await outputFiles({
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
      })

      const base = new Base(self)
      await base.prepare()

      const childProcess = base.run('dev')
      try {
        await nuxtDevReady()
        await this.page.goto('http://localhost:3000')

        const foo = await this.page.waitForSelector('.foo')
        await this.page.waitForFunction(
          el => getComputedStyle(el).backgroundColor === 'rgb(255, 0, 0)',
          {},
          foo,
        )
      } finally {
        await kill(childProcess.pid)
      }
    },
    async 'dotenv: config'() {
      await outputFiles({
        '.env.schema.json': JSON.stringify({ foo: { type: 'string' } }),
        '.test.env.json': JSON.stringify({ foo: 'Bar' }),
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
      })

      const base = new Base(self)
      await base.prepare()

      const childProcess = base.run('dev')
      try {
        await nuxtDevReady()
        await this.page.goto('http://localhost:3000')
        await this.page.waitForFunction(() => document.title === 'Bar')
      } finally {
        await kill(childProcess.pid)
      }
    },
    'dotenv: module': async () => {
      await outputFiles({
        '.env.schema.json': JSON.stringify({ foo: { type: 'string' } }),
        '.test.env.json': JSON.stringify({ foo: 'bar' }),
        'modules/foo.js': endent`
          import { expect } from 'expect'

          export default () => expect(process.env.FOO).toEqual('bar')
        `,
        'package.json': JSON.stringify({ dependencies: { expect: '*' } }),
        'pages/index.vue': endent`
          <template>
            <div>Hello world</div>
          </template>
        `,
      })

      const base = new Base(self)
      await base.prepare()
      await base.run('prepublishOnly')
    },
    async 'global components'() {
      await outputFiles({
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
      })

      const base = new Base(self)
      await base.prepare()

      const childProcess = base.run('dev')
      try {
        await nuxtDevReady()
        await this.page.goto('http://localhost:3000')

        const handle = await this.page.waitForSelector('.foo')
        expect(await handle.evaluate(div => div.textContent)).toEqual(
          'Hello world',
        )
      } finally {
        await kill(childProcess.pid)
      }
    },
    'head in module': async () => {
      await fs.outputFile(
        'modules/mod.js',
        "export default (options, nuxt) => nuxt.options.app.head.script.push('foo')",
      )

      const base = new Base(self)
      await base.prepare()
      await base.run('prepublishOnly')
    },
    async 'head link'() {
      await outputFiles({
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
      })

      const base = new Base(self)
      await base.prepare()

      const childProcess = base.run('dev')
      try {
        await nuxtDevReady()
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
      } finally {
        await kill(childProcess.pid)
      }
    },
    async hexrgba() {
      await outputFiles({
        'assets/style.css': endent`
          body {
            background: rgba(#fff, .5);
          }
        `,
        'config.js': endent`
          export default {
            css: ['@/assets/style.css'],
          }
        `,
        'pages/index.vue': endent`
          <template>
            <div />
          </template>
        `,
      })

      const base = new Base(self)
      await base.prepare()

      const childProcess = base.run('dev')
      try {
        await nuxtDevReady()
        await this.page.goto('http://localhost:3000')
        await this.page.waitForFunction(
          () =>
            getComputedStyle(document.body).backgroundColor ===
            'rgba(0, 0, 0, 0)',
        )
      } finally {
        await kill(childProcess.pid)
      }
    },
    async htmlAttrs() {
      await outputFiles({
        'config.js': endent`
          export default {
            htmlAttrs: {
              class: 'foo',
            },
          }
        `,
        'pages/index.vue': endent`
          <template>
            <div>Hello world</div>
          </template>
        `,
      })

      const base = new Base(self)
      await base.prepare()

      const childProcess = base.run('dev')
      try {
        await nuxtDevReady()
        await this.page.goto('http://localhost:3000')
        await this.page.waitForSelector('html.foo')
      } finally {
        await kill(childProcess.pid)
      }
    },
    'i18n: browser language changed': async () => {
      await outputFiles({
        i18n: {
          'de.json': JSON.stringify({}),
          'en.json': JSON.stringify({}),
        },
        'pages/index.vue': endent`
          <template>
            <div />
          </template>
        `,
      })

      const base = new Base(self)
      await base.prepare()

      const childProcess = base.run('dev')
      try {
        await nuxtDevReady()
        expect(
          axios.get('http://localhost:3000')
            |> await
            |> property('request.res.responseUrl'),
        ).toEqual('http://localhost:3000/en')
        expect(
          axios.get('http://localhost:3000', {
            headers: { 'Accept-Language': 'de' },
          })
            |> await
            |> property('request.res.responseUrl'),
        ).toEqual('http://localhost:3000/de')
      } finally {
        await kill(childProcess.pid)
      }
    },
    async 'i18n: middleware'() {
      await outputFiles({
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
        'middleware/foo.js': 'export default () => {}',
        'pages/index.vue': endent`
          <template>
            <div class="foo">Hello world</div>
          </template>
        `,
      })

      const base = new Base(self)
      await base.prepare()

      const childProcess = base.run('dev')
      try {
        await nuxtDevReady()
        await this.page.goto('http://localhost:3000')

        const handle = await this.page.waitForSelector('.foo')
        expect(await handle.evaluate(div => div.textContent)).toEqual(
          'Hello world',
        )
      } finally {
        await kill(childProcess.pid)
      }
    },
    async 'i18n: root with prefix'() {
      await outputFiles({
        i18n: {
          'de.json': JSON.stringify({}),
          'en.json': JSON.stringify({}),
        },
        'pages/index.vue': endent`
          <template>
            <div />
          </template>
        `,
      })

      const base = new Base(self)
      await base.prepare()

      const childProcess = base.run('dev')
      try {
        await nuxtDevReady()
        await this.page.goto('http://localhost:3000/de')
        expect(await this.page.url()).toEqual('http://localhost:3000/de')
      } finally {
        await kill(childProcess.pid)
      }
    },
    async 'i18n: root without prefix'() {
      await outputFiles({
        i18n: {
          'de.json': JSON.stringify({}),
          'en.json': JSON.stringify({}),
        },
        'pages/index.vue': endent`
          <template>
            <div />
          </template>
        `,
      })

      const base = new Base(self)
      await base.prepare()

      const childProcess = base.run('dev')
      try {
        await nuxtDevReady()
        expect(
          axios.get('http://localhost:3000', {
            headers: { 'Accept-Language': 'de' },
          })
            |> await
            |> property('request.res.responseUrl'),
        ).toEqual('http://localhost:3000/de')
        await this.page.setExtraHTTPHeaders({
          'Accept-Language': 'de',
        })
      } finally {
        await kill(childProcess.pid)
      }
    },
    'i18n: route with prefix': async () => {
      await outputFiles({
        i18n: {
          'de.json': JSON.stringify({}),
          'en.json': JSON.stringify({}),
        },
        'pages/foo.vue': endent`
          <template>
            <div />
          </template>
        `,
      })

      const base = new Base(self)
      await base.prepare()

      const childProcess = base.run('dev')
      try {
        await nuxtDevReady()
        expect(
          axios.get('http://localhost:3000/de/foo', {
            headers: { 'Accept-Language': 'de' },
          })
            |> await
            |> property('request.res.responseUrl'),
        ).toEqual('http://localhost:3000/de/foo')
      } finally {
        await kill(childProcess.pid)
      }
    },
    'i18n: route without prefix': async () => {
      await outputFiles({
        i18n: {
          'de.json': JSON.stringify({}),
          'en.json': JSON.stringify({}),
        },
        'pages/foo.vue': endent`
          <template>
            <div />
          </template>
        `,
      })

      const base = new Base(self)
      await base.prepare()

      const childProcess = base.run('dev')
      try {
        await nuxtDevReady()
        expect(
          axios.get('http://localhost:3000/foo', {
            headers: { 'Accept-Language': 'de' },
          })
            |> await
            |> property('request.res.responseUrl'),
        ).toEqual('http://localhost:3000/de/foo')
      } finally {
        await kill(childProcess.pid)
      }
    },
    async 'i18n: single locale'() {
      await outputFiles({
        'i18n/de.json': JSON.stringify({ foo: 'bar' }),
        pages: {
          'bar.vue': endent`
            <template>
              <div class="bar" />
            </template>
          `,
          'index.vue': endent`
            <template>
              <nuxt-locale-link :to="{ name: 'bar' }" class="foo">{{ $t('foo') }}</nuxt-locale-link>
            </template>
          `,
        },
      })

      const base = new Base(self)
      await base.prepare()

      const childProcess = base.run('dev')
      try {
        await nuxtDevReady()
        await this.page.setExtraHTTPHeaders({
          'Accept-Language': 'en',
        })
        await this.page.goto('http://localhost:3000')
        expect(await this.page.url()).toEqual('http://localhost:3000/')

        const link = await this.page.waitForSelector('.foo')
        expect(await link.evaluate(el => el.textContent)).toEqual('bar')
        expect(await link.evaluate(el => el.href)).toEqual(
          'http://localhost:3000/bar',
        )
      } finally {
        await kill(childProcess.pid)
      }
    },
    async 'i18n: works'() {
      await outputFiles({
        '.env.schema.json': JSON.stringify({ baseUrl: { type: 'string' } }),
        '.test.env.json': JSON.stringify({ baseUrl: 'http://localhost:3000' }),
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
      })

      const base = new Base(self)
      await base.prepare()

      const childProcess = base.run('dev')
      try {
        await nuxtDevReady()
        await this.page.goto('http://localhost:3000')
        expect(await this.page.url()).toEqual('http://localhost:3000/en')

        const [foo, html] = await Promise.all([
          this.page.waitForSelector('.foo'),
          this.page.waitForSelector('html[lang=en]'),
          this.page.waitForSelector(
            'link[rel=alternate][href="http://localhost:3000/de"][hreflang=de]',
          ),
          this.page.waitForSelector(
            'link[rel=alternate][href="http://localhost:3000/en"][hreflang=en]',
          ),
          this.page.waitForSelector(
            'link[rel=icon][type="image/x-icon"][href="/favicon.ico"]',
          ),
        ])
        expect(await foo.evaluate(div => div.textContent)).toEqual(
          'Hello world',
        )
        expect(await html.evaluate(el => el.getAttribute('style'))).toEqual(
          'background: red',
        )
      } finally {
        await kill(childProcess.pid)
      }
    },
    async 'locale link'() {
      await outputFiles({
        i18n: {
          'de.json': JSON.stringify({}),
          'en.json': JSON.stringify({}),
        },
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
      })

      const base = new Base(self)
      await base.prepare()

      const childProcess = base.run('dev')
      try {
        await nuxtDevReady()
        await this.page.goto('http://localhost:3000')
        expect(await this.page.$eval('a', a => a.getAttribute('href'))).toEqual(
          '/en/foo',
        )
      } finally {
        await kill(childProcess.pid)
      }
    },
    async name() {
      await outputFiles({
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
      })

      const base = new Base(self)
      await base.prepare()

      const childProcess = base.run('dev')
      try {
        await nuxtDevReady()
        await this.page.goto('http://localhost:3000')
        await this.page.waitForFunction(() => document.title === 'Test-App')
      } finally {
        await kill(childProcess.pid)
      }
    },
    async 'name and title'() {
      await outputFiles({
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
      })

      const base = new Base(self)
      await base.prepare()

      const childProcess = base.run('dev')
      try {
        await nuxtDevReady()
        await this.page.goto('http://localhost:3000')
        await this.page.waitForFunction(
          () => document.title === 'Test-App: This is the ultimate app!',
        )
      } finally {
        await kill(childProcess.pid)
      }
    },
    async ogImage() {
      await outputFiles({
        'config.js': endent`
          export default {
            ogImage: 'https://example.com/og-image',
          }
        `,
        'pages/index.vue': endent`
          <template>
            <div />
          </template>
        `,
      })

      const base = new Base(self)
      await base.prepare()

      const childProcess = base.run('dev')
      try {
        await nuxtDevReady()
        await this.page.goto('http://localhost:3000')

        const handle = await this.page.waitForSelector('meta[name=og\\:image]')
        expect(await handle.evaluate(meta => meta.content)).toEqual(
          'https://example.com/og-image',
        )
      } finally {
        await kill(childProcess.pid)
      }
    },
    async 'page with title'() {
      await outputFiles({
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
      })

      const base = new Base(self)
      await base.prepare()

      const childProcess = base.run('dev')
      try {
        await nuxtDevReady()
        await this.page.goto('http://localhost:3000/foo')
        await this.page.waitForFunction(
          () => document.title === 'Foo page | Test-App',
        )
      } finally {
        await kill(childProcess.pid)
      }
    },
    async port() {
      await outputFiles({
        '.env.schema.json': JSON.stringify({ port: { type: 'integer' } }),
        '.test.env.json': JSON.stringify({ port: 3005 }),
        'pages/index.vue': endent`
          <template>
            <div class="foo" />
          </template>
        `,
      })

      const base = new Base(self)
      await base.prepare()

      const childProcess = base.run('dev')
      try {
        await nuxtDevReady(3005)
        await this.page.goto('http://localhost:3005')
        await this.page.waitForSelector('.foo')
      } finally {
        await kill(childProcess.pid)
      }
    },
    async 'request body'() {
      await fs.outputFile(
        'pages/index.vue',
        endent`
          <template>
            <form method="POST" :class="{ sent }">
              <button name="submit" type="submit" @submit="send">Send</button>
            </form>
          </template>

          <script setup>
          import { useRequestEvent } from '#imports'
          import { getMethod, readBody } from 'h3'

          const event = useRequestEvent()

          const sent = event && getMethod(event) === 'POST' && (await readBody(event)).submit !== undefined
          </script>
        `,
      )

      const base = new Base(self)
      await base.prepare()

      const childProcess = base.run('dev')
      try {
        await nuxtDevReady()
        await this.page.goto('http://localhost:3000')

        const button = await this.page.waitForSelector('button')
        await button.click()
        await this.page.waitForSelector('form.sent')
      } finally {
        await kill(childProcess.pid)
      }
    },
    async 'router config'() {
      await outputFiles({
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
              <nuxt-link :to="{ name: 'index' }" class="foo" />
            </template>
          `,
          'inner/info.vue': '<template />',
        },
      })

      const base = new Base(self)
      await base.prepare()

      const childProcess = base.run('dev')
      try {
        await nuxtDevReady()
        await this.page.goto('http://localhost:3000')
        await this.page.waitForSelector('.foo.is-active')
      } finally {
        await kill(childProcess.pid)
      }
    },
    sitemap: async () => {
      await outputFiles({
        'config.js': endent`
          export default {
            modules: [
              '${packageName`@funken-studio/sitemap-nuxt-3`}',
            ]
          }
        `,
        i18n: {
          'de.json': JSON.stringify({}),
          'en.json': JSON.stringify({}),
        },
        'pages/index.vue': endent`
          <template>
            <div class="foo">Hello world</div>
          </template>
        `,
      })

      const base = new Base(self)
      await base.prepare()

      const childProcess = base.run('dev')
      try {
        await nuxtDevReady()

        const sitemap =
          (await axios.get('http://localhost:3000/sitemap.xml'))
          |> await
          |> property('data')
        expect(
          xmlFormatter(sitemap, {
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
      } finally {
        await kill(childProcess.pid)
      }
    },
    async 'svg inline'() {
      await outputFiles({
        'assets/icon.svg': '<svg xmlns="http://www.w3.org/2000/svg" />',
        'pages/index.vue': endent`
          <template>
            <icon class="icon" />
          </template>

          <script>
          import Icon from '@/assets/icon.svg'

          export default {
            components: {
              Icon,
            },
          }
          </script>
        `,
      })

      const base = new Base(self)
      await base.prepare()

      const childProcess = base.run('dev')
      try {
        await nuxtDevReady()
        await this.page.goto('http://localhost:3000')

        const icon = await this.page.waitForSelector('.icon')
        expect(await icon.evaluate(el => el.tagName)).toEqual('svg')
      } finally {
        await kill(childProcess.pid)
      }
    },
    async 'svg url'() {
      await outputFiles({
        'assets/image.svg': '<svg xmlns="http://www.w3.org/2000/svg" />',
        'pages/index.vue': endent`
          <template>
            <img class="image" :src="imageUrl" />
          </template>

          <script>
          import imageUrl from '@/assets/image.svg?url'

          export default {
            computed: {
              imageUrl: () => imageUrl,
            },
          }
          </script>
        `,
      })

      const base = new Base(self)
      await base.prepare()

      const childProcess = base.run('dev')
      try {
        await nuxtDevReady()
        await this.page.goto('http://localhost:3000')

        const image = await this.page.waitForSelector('.image')
        expect(await image.evaluate(el => el.tagName)).toEqual('IMG')
        expect(await image.evaluate(el => el.getAttribute('src'))).toEqual(
          '/_nuxt/assets/image.svg',
        )
      } finally {
        await kill(childProcess.pid)
      }
    },
    async userScalable() {
      await outputFiles({
        'config.js': endent`
          export default {
            userScalable: false,
          }
        `,
        'pages/index.vue': endent`
          <template>
            <div />
          </template>
        `,
      })

      const base = new Base(self)
      await base.prepare()

      const childProcess = base.run('dev')
      try {
        await nuxtDevReady()
        await this.page.goto('http://localhost:3000')
        await this.page.waitForSelector(
          'meta[name=viewport][content$=user-scalable\\=0]',
        )
      } finally {
        await kill(childProcess.pid)
      }
    },
    async valid() {
      await fs.outputFile(
        'pages/index.vue',
        endent`
          <template>
            <div class="foo">Hello world</div>
          </template>
        `,
      )

      const base = new Base(self)
      await base.prepare()

      const childProcess = base.run('dev')
      try {
        await nuxtDevReady()
        await this.page.goto('http://localhost:3000')

        const handle = await this.page.waitForSelector('.foo')
        expect(await handle.evaluate(div => div.textContent)).toEqual(
          'Hello world',
        )
      } finally {
        await kill(childProcess.pid)
      }
    },
  },
  [testerPluginTmpDir(), testerPluginPuppeteer()],
)
