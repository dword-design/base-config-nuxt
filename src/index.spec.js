import { Base } from '@dword-design/base';
import { endent, property } from '@dword-design/functions';
import tester from '@dword-design/tester';
import testerPluginTmpDir from '@dword-design/tester-plugin-tmp-dir';
import axios from 'axios';
import packageName from 'depcheck-package-name';
import fs from 'fs-extra';
import nuxtDevReady from 'nuxt-dev-ready';
import outputFiles from 'output-files';
import { chromium } from 'playwright';
import portReady from 'port-ready';
import kill from 'tree-kill-promise';
import xmlFormatter from 'xml-formatter';

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
      });

      const base = new Base({ name: '../src/index.js' });
      await base.prepare();
      const childProcess = base.run('dev');

      try {
        await nuxtDevReady();
        await this.page.goto('http://localhost:3000');
        const handle = await this.page.waitForSelector('.foo');

        expect(await handle.evaluate(div => div.textContent)).toEqual(
          'Hello world',
        );
      } finally {
        await kill(childProcess.pid);
      }
    },
    api: async () => {
      await fs.outputFile(
        'server/api/foo.get.js',
        endent`
          import { defineEventHandler } from '#imports'

          export default defineEventHandler(() => ({ foo: 'bar' }))
        `,
      );

      const base = new Base({ name: '../src/index.js' });
      await base.prepare();
      const childProcess = base.run('dev');

      try {
        await nuxtDevReady();

        const result =
          axios.get('http://localhost:3000/api/foo')
          |> await
          |> property('data');

        expect(result).toEqual({ foo: 'bar' });
      } finally {
        await kill(childProcess.pid);
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
      });

      const base = new Base({ name: '../src/index.js' });
      await base.prepare();
      const childProcess = base.run('dev');

      try {
        await nuxtDevReady();
        await this.page.goto('http://localhost:3000');
        const foo = await this.page.waitForSelector('.foo');
        expect(await foo.evaluate(el => el.innerText)).toEqual('Hello world');
      } finally {
        await kill(childProcess.pid);
      }
    },
    'babel in api': async () => {
      await fs.outputFile(
        'server/api/foo.get.js',
        endent`
          import { defineEventHandler } from '#imports'

          export default defineEventHandler(() => 1 |> x => x * 2)
        `,
      );

      const base = new Base({ name: '../src/index.js' });
      await base.prepare();
      const childProcess = base.run('dev');

      try {
        await nuxtDevReady();

        const result =
          axios.get('http://localhost:3000/api/foo')
          |> await
          |> property('data');

        expect(result).toEqual(2);
      } finally {
        await kill(childProcess.pid);
      }
    },
    async 'babel in composable'() {
      await outputFiles({
        'composables/foo.js': 'export const foo = 1 |> x => x * 2',
        'pages/index.vue': endent`
          <template>
            <div class="foo">{{ foo }}</div>
          </template>

          <script setup>
          import { foo } from '#imports'
          </script>
        `,
      });

      const base = new Base({ name: '../src/index.js' });
      await base.prepare();
      const childProcess = base.run('dev');

      try {
        await nuxtDevReady();
        await this.page.goto('http://localhost:3000');
        const foo = await this.page.waitForSelector('.foo');
        expect(await foo.evaluate(el => el.innerText)).toEqual('2');
      } finally {
        await kill(childProcess.pid);
      }
    },
    async 'babel in file imported from api'() {
      await outputFiles({
        'config.js': endent`
          import { createResolver } from '@nuxt/kit';

          const resolver = createResolver(import.meta.url);

          export default {
            nitro: {
              externals: {
                inline: [resolver.resolve('./model')],
              },
            },
          };
        `,
        'model/foo.js': 'export default 1 |> x => x * 2',
        'pages/index.vue': endent`
          <template>
            <div class="foo" />
          </template>
        `,
        'server/api/foo.get.js': endent`
          import { defineEventHandler } from '#imports';

          import foo from '@/model/foo.js';

          export default defineEventHandler(() => foo);
        `,
      });

      const base = new Base({ name: '../src/index.js' });
      await base.prepare();
      const oldNodeOptions = process.env.NODE_OPTIONS;
      // Remove babel Node.js loader for tests temporarily
      process.env.NODE_OPTIONS = '';
      const childProcess = base.run('dev');

      try {
        await nuxtDevReady();
        await this.page.goto('http://localhost:3000');
        await this.page.waitForSelector('.foo', { state: 'attached' });
      } finally {
        await kill(childProcess.pid);
        process.env.NODE_OPTIONS = oldNodeOptions;
      }
    },
    async 'babel in plugin'() {
      await outputFiles({
        'pages/index.vue': endent`
          <template>
            <div class="foo">{{ foo }}</div>
          </template>

          <script setup>
          import { useNuxtApp } from '#imports'

          const nuxtApp = useNuxtApp()
          const foo = nuxtApp.$foo
          </script>
        `,
        'plugins/foo.js': endent`
          import { defineNuxtPlugin } from '#imports'

          export default defineNuxtPlugin(() => ({ provide: { foo: 1 |> x => x * 2 } }))
        `,
      });

      const base = new Base({ name: '../src/index.js' });
      await base.prepare();
      const childProcess = base.run('dev');

      try {
        await nuxtDevReady();
        await this.page.goto('http://localhost:3000');
        const foo = await this.page.waitForSelector('.foo');
        expect(await foo.evaluate(el => el.innerText)).toEqual('2');
      } finally {
        await kill(childProcess.pid);
      }
    },
    async 'babel in vue'() {
      await fs.outputFile(
        'pages/index.vue',
        endent`
          <template>
            <div class="foo">{{ foo }}</div>
          </template>

          <script>
          export default {
            computed: {
              foo: () => 1 |> x => x * 2,
            },
          }
          </script>
        `,
      );

      const base = new Base({ name: '../src/index.js' });
      await base.prepare();
      const childProcess = base.run('dev');

      try {
        await nuxtDevReady();
        await this.page.goto('http://localhost:3000');
        const foo = await this.page.waitForSelector('.foo');
        expect(await foo.evaluate(el => el.innerText)).toEqual('2');
      } finally {
        await kill(childProcess.pid);
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
        'pages/index.vue': endent`
          <template>
            <div />
          </template>
        `,
        'server/api/foo.get.js': endent`
          import { defineEventHandler } from '#imports'

          export default defineEventHandler(() => 'foo')
        `,
      });

      const base = new Base({ name: '../src/index.js' });
      await base.prepare();
      const childProcess = base.run('dev');

      try {
        await nuxtDevReady();

        await expect(axios.get('http://localhost:3000')).rejects.toHaveProperty(
          'response.status',
          401,
        );

        await expect(
          axios.get('http://localhost:3000/api/foo'),
        ).rejects.toHaveProperty('response.status', 401);

        await Promise.all([
          axios.get('http://localhost:3000', {
            auth: { password: 'bar', username: 'foo' },
          }),
          axios.get('http://localhost:3000/api/foo', {
            auth: { password: 'bar', username: 'foo' },
          }),
        ]);
      } finally {
        await kill(childProcess.pid);
      }
    },
    async bodyAttrs() {
      await outputFiles({
        'config.js': endent`
          export default {
            app: {
              head: {
                bodyAttrs: {
                  class: 'foo',
                },
              },
            },
          }
        `,
        'pages/index.vue': endent`
          <template>
            <div>Hello world</div>
          </template>

        `,
      });

      const base = new Base({ name: '../src/index.js' });
      await base.prepare();
      const childProcess = base.run('dev');

      try {
        await nuxtDevReady();
        await this.page.goto('http://localhost:3000');

        expect(
          await this.page.evaluate(() =>
            document.body.classList.contains('foo'),
          ),
        ).toEqual(true);
      } finally {
        await kill(childProcess.pid);
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
      });

      const base = new Base({ name: '../src/index.js' });
      await base.prepare();
      const childProcess = base.run('dev');

      try {
        await nuxtDevReady();
        await this.page.goto('http://localhost:3000');
        const foo = await this.page.waitForSelector('.foo');

        await this.page.waitForFunction(
          el => getComputedStyle(el).backgroundColor === 'rgb(255, 0, 0)',
          foo,
        );
      } finally {
        await kill(childProcess.pid);
      }
    },
    async 'css modules'() {
      await outputFiles({
        'pages/index.vue': endent`
          <template>
            <div class="foo" :class="$style.fooBar">Hello world</div>
          </template>

          <style lang="scss" module>
          .foo-bar {
            background: red;
          }
          </style>
        `,
      });

      const base = new Base({ name: '../src/index.js' });
      await base.prepare();
      const childProcess = base.run('dev');

      try {
        await nuxtDevReady();
        await this.page.goto('http://localhost:3000');
        const foo = await this.page.waitForSelector('.foo');

        await this.page.waitForFunction(
          el => getComputedStyle(el).backgroundColor === 'rgb(255, 0, 0)',
          foo,
        );
      } finally {
        await kill(childProcess.pid);
      }
    },
    'do not import image urls in production': async () => {
      await outputFiles({
        'pages/index.vue': endent`
          <template>
            <img src="/api/foo.png" />
          </template>
        `,
      });

      const base = new Base({ name: '../src/index.js' });
      await base.prepare();
      await base.run('prepublishOnly');
      const nuxt = base.run('start');

      try {
        await portReady(3000);
      } finally {
        await kill(nuxt.pid);
      }
    },
    async 'do not transpile other language than js in vue'() {
      await fs.outputFile(
        'pages/index.vue',
        endent`
          <template>
            <div class="foo">{{ foo }}</div>
          </template>

          <script setup lang="ts">
          const foo: number = 2
          </script>
        `,
      );

      const base = new Base({ name: '../src/index.js' });
      await base.prepare();
      const childProcess = base.run('dev');

      try {
        await nuxtDevReady();
        await this.page.goto('http://localhost:3000');
        const foo = await this.page.waitForSelector('.foo');
        expect(await foo.evaluate(el => el.innerText)).toEqual('2');
      } finally {
        await kill(childProcess.pid);
      }
    },
    'do not transpile vue in node_modules': async () => {
      await outputFiles({
        'node_modules/foo': {
          'index.vue': endent`
            <template>
              <div class="foo">{{ foo }}</div>
            </template>

            <script setup>
            const foo = 1 |> x => x * 2
            </script>
          `,
          'package.json': JSON.stringify({ main: 'index.vue', name: 'foo' }),
        },
        'package.json': JSON.stringify({ dependencies: { foo: '*' } }),
        'pages/index.vue': endent`
          <template>
            <foo />
          </template>

          <script setup>
          import Foo from 'foo'
          </script>
        `,
      });

      const base = new Base({ name: '../src/index.js' });
      await base.prepare();

      await expect(base.run('prepublishOnly')).rejects.toThrow(
        'This experimental syntax requires enabling the parser plugin: "pipelineOperator".',
      );
    },
    async 'dotenv: config'() {
      await outputFiles({
        '.env.json': JSON.stringify({ foo: 'Foo' }),
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
      });

      const base = new Base({ name: '../src/index.js' });
      await base.prepare();
      const childProcess = base.run('dev');

      try {
        await nuxtDevReady();
        await this.page.goto('http://localhost:3000');
        expect(await this.page.evaluate(() => document.title)).toEqual('Bar');
      } finally {
        await kill(childProcess.pid);
      }
    },
    'dotenv: module': async () => {
      await outputFiles({
        '.env.schema.json': JSON.stringify({ foo: { type: 'string' } }),
        '.test.env.json': JSON.stringify({ foo: 'bar' }),
        'modules/foo.js': endent`
          import { expect } from '${packageName`expect`}'

          export default () => expect(process.env.FOO).toEqual('bar')
        `,
        'package.json': JSON.stringify({ dependencies: { expect: '*' } }),
        'pages/index.vue': endent`
          <template>
            <div>Hello world</div>
          </template>
        `,
      });

      const base = new Base({ name: '../src/index.js' });
      await base.prepare();
      await base.run('prepublishOnly');
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
      });

      const base = new Base({ name: '../src/index.js' });
      await base.prepare();
      const childProcess = base.run('dev');

      try {
        await nuxtDevReady();
        await this.page.goto('http://localhost:3000');
        const handle = await this.page.waitForSelector('.foo');

        expect(await handle.evaluate(div => div.textContent)).toEqual(
          'Hello world',
        );
      } finally {
        await kill(childProcess.pid);
      }
    },
    'head in module': async () => {
      await fs.outputFile(
        'modules/mod.js',
        "export default (options, nuxt) => nuxt.options.app.head.script.push('foo')",
      );

      const base = new Base({ name: '../src/index.js' });
      await base.prepare();
      await base.run('prepublishOnly');
    },
    async 'head link'() {
      await outputFiles({
        'config.js': endent`
          export default {
            app: {
              head: {
                link: [
                  { rel: 'alternate', type: 'application/rss+xml', title: 'Blog', href: '/feed' }
                ],
              },
            },
          }
        `,
        'pages/index.vue': endent`
          <template>
            <div />
          </template>
        `,
      });

      const base = new Base({ name: '../src/index.js' });
      await base.prepare();
      const childProcess = base.run('dev');

      try {
        await nuxtDevReady();
        await this.page.goto('http://localhost:3000');

        const link = await this.page.waitForSelector('link[rel=alternate]', {
          state: 'attached',
        });

        expect(
          await Promise.all([
            link.evaluate(el => el.getAttribute('rel')),
            link.evaluate(el => el.getAttribute('type')),
            link.evaluate(el => el.getAttribute('title')),
            link.evaluate(el => el.getAttribute('href')),
          ]),
        ).toEqual(['alternate', 'application/rss+xml', 'Blog', '/feed']);
      } finally {
        await kill(childProcess.pid);
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
      });

      const base = new Base({ name: '../src/index.js' });
      await base.prepare();
      const childProcess = base.run('dev');

      try {
        await nuxtDevReady();
        await this.page.goto('http://localhost:3000');

        await this.page.waitForFunction(
          () =>
            getComputedStyle(document.body).backgroundColor ===
            'rgba(0, 0, 0, 0)',
        );
      } finally {
        await kill(childProcess.pid);
      }
    },
    async htmlAttrs() {
      await outputFiles({
        'config.js': endent`
          export default {
            app: {
              head: {
                htmlAttrs: {
                  class: 'foo',
                },
              },
            },
          }
        `,
        'pages/index.vue': endent`
          <template>
            <div>Hello world</div>
          </template>
        `,
      });

      const base = new Base({ name: '../src/index.js' });
      await base.prepare();
      const childProcess = base.run('dev');

      try {
        await nuxtDevReady();
        await this.page.goto('http://localhost:3000');
        await this.page.waitForSelector('html.foo');
      } finally {
        await kill(childProcess.pid);
      }
    },
    'i18n: browser language changed': async () => {
      await outputFiles({
        i18n: { 'de.json': JSON.stringify({}), 'en.json': JSON.stringify({}) },
        'pages/index.vue': endent`
          <template>
            <div />
          </template>
        `,
      });

      const base = new Base({ name: '../src/index.js' });
      await base.prepare();
      const childProcess = base.run('dev');

      try {
        await nuxtDevReady();

        expect(
          axios.get('http://localhost:3000')
            |> await
            |> property('request.res.responseUrl'),
        ).toEqual('http://localhost:3000/en');

        expect(
          axios.get('http://localhost:3000', {
            headers: { 'Accept-Language': 'de' },
          })
            |> await
            |> property('request.res.responseUrl'),
        ).toEqual('http://localhost:3000/de');
      } finally {
        await kill(childProcess.pid);
      }
    },
    async 'i18n: change page, meta up-to-date'() {
      await outputFiles({
        '.env.schema.json': JSON.stringify({ baseUrl: { type: 'string' } }),
        '.test.env.json': JSON.stringify({ baseUrl: 'http://localhost:3000' }),
        i18n: { 'en.json': JSON.stringify({ foo: 'Hello world' }) },
        pages: {
          'foo.vue': endent`
            <template>
              <div />
            </template>
          `,
          'index.vue': endent`
            <template>
              <div />
            </template>
          `,
        },
      });

      const base = new Base({ name: '../src/index.js' });
      await base.prepare();
      const childProcess = base.run('dev');

      try {
        await nuxtDevReady();
        await this.page.goto('http://localhost:3000');

        await this.page.waitForSelector(
          'link[rel=canonical][href="http://localhost:3000"]',
          { state: 'attached' },
        );

        await this.page.goto('http://localhost:3000/foo');

        await this.page.waitForSelector(
          'link[rel=canonical][href="http://localhost:3000/foo"]',
          { state: 'attached' },
        );
      } finally {
        await kill(childProcess.pid);
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
      });

      const base = new Base({ name: '../src/index.js' });
      await base.prepare();
      const childProcess = base.run('dev');

      try {
        await nuxtDevReady();
        await this.page.goto('http://localhost:3000');
        const handle = await this.page.waitForSelector('.foo');

        expect(await handle.evaluate(div => div.textContent)).toEqual(
          'Hello world',
        );
      } finally {
        await kill(childProcess.pid);
      }
    },
    async 'i18n: root with prefix'() {
      await outputFiles({
        i18n: { 'de.json': JSON.stringify({}), 'en.json': JSON.stringify({}) },
        'pages/index.vue': endent`
          <template>
            <div />
          </template>
        `,
      });

      const base = new Base({ name: '../src/index.js' });
      await base.prepare();
      const childProcess = base.run('dev');

      try {
        await nuxtDevReady();
        await this.page.goto('http://localhost:3000/de');
        expect(await this.page.url()).toEqual('http://localhost:3000/de');
      } finally {
        await kill(childProcess.pid);
      }
    },
    async 'i18n: root without prefix'() {
      await outputFiles({
        i18n: { 'de.json': JSON.stringify({}), 'en.json': JSON.stringify({}) },
        'pages/index.vue': endent`
          <template>
            <div />
          </template>
        `,
      });

      const base = new Base({ name: '../src/index.js' });
      await base.prepare();
      const childProcess = base.run('dev');

      try {
        await nuxtDevReady();

        expect(
          axios.get('http://localhost:3000', {
            headers: { 'Accept-Language': 'de' },
          })
            |> await
            |> property('request.res.responseUrl'),
        ).toEqual('http://localhost:3000/de');

        await this.page.setExtraHTTPHeaders({ 'Accept-Language': 'de' });
      } finally {
        await kill(childProcess.pid);
      }
    },
    'i18n: route with prefix': async () => {
      await outputFiles({
        i18n: { 'de.json': JSON.stringify({}), 'en.json': JSON.stringify({}) },
        'pages/foo.vue': endent`
          <template>
            <div />
          </template>
        `,
      });

      const base = new Base({ name: '../src/index.js' });
      await base.prepare();
      const childProcess = base.run('dev');

      try {
        await nuxtDevReady();

        expect(
          axios.get('http://localhost:3000/de/foo', {
            headers: { 'Accept-Language': 'de' },
          })
            |> await
            |> property('request.res.responseUrl'),
        ).toEqual('http://localhost:3000/de/foo');
      } finally {
        await kill(childProcess.pid);
      }
    },
    'i18n: route without prefix': async () => {
      await outputFiles({
        i18n: { 'de.json': JSON.stringify({}), 'en.json': JSON.stringify({}) },
        'pages/foo.vue': endent`
          <template>
            <div />
          </template>
        `,
      });

      const base = new Base({ name: '../src/index.js' });
      await base.prepare();
      const childProcess = base.run('dev');

      try {
        await nuxtDevReady();

        expect(
          axios.get('http://localhost:3000/foo', {
            headers: { 'Accept-Language': 'de' },
          })
            |> await
            |> property('request.res.responseUrl'),
        ).toEqual('http://localhost:3000/de/foo');
      } finally {
        await kill(childProcess.pid);
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
      });

      const base = new Base({ name: '../src/index.js' });
      await base.prepare();
      const childProcess = base.run('dev');

      try {
        await nuxtDevReady();
        await this.page.setExtraHTTPHeaders({ 'Accept-Language': 'en' });
        await this.page.goto('http://localhost:3000');
        expect(await this.page.url()).toEqual('http://localhost:3000/');
        const link = await this.page.waitForSelector('.foo');
        expect(await link.evaluate(el => el.textContent)).toEqual('bar');

        expect(await link.evaluate(el => el.href)).toEqual(
          'http://localhost:3000/bar',
        );
      } finally {
        await kill(childProcess.pid);
      }
    },
    async 'i18n: works'() {
      await outputFiles({
        '.env.schema.json': JSON.stringify({ baseUrl: { type: 'string' } }),
        '.test.env.json': JSON.stringify({ baseUrl: 'http://localhost:3000' }),
        'config.js': endent`
          export default {
            app: {
              head: {
                htmlAttrs: { style: 'background: red' },
                link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
              },
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
      });

      const base = new Base({ name: '../src/index.js' });
      await base.prepare();
      const childProcess = base.run('dev');

      try {
        await nuxtDevReady();
        await this.page.goto('http://localhost:3000');
        expect(await this.page.url()).toEqual('http://localhost:3000/en');

        const [foo, html] = await Promise.all([
          this.page.waitForSelector('.foo'),
          this.page.waitForSelector('html[lang=en]'),
          this.page.waitForSelector(
            'link[rel=canonical][href="http://localhost:3000/en"]',
            { state: 'attached' },
          ),
          this.page.waitForSelector(
            'link[rel=alternate][href="http://localhost:3000/de"][hreflang=de]',
            { state: 'attached' },
          ),
          this.page.waitForSelector(
            'link[rel=alternate][href="http://localhost:3000/en"][hreflang=en]',
            { state: 'attached' },
          ),
          this.page.waitForSelector(
            'link[rel=icon][type="image/x-icon"][href="/favicon.ico"]',
            { state: 'attached' },
          ),
        ]);

        expect(await foo.evaluate(div => div.textContent)).toEqual(
          'Hello world',
        );

        expect(await html.evaluate(el => el.getAttribute('style'))).toEqual(
          'background:red',
        );
      } finally {
        await kill(childProcess.pid);
      }
    },
    /* async 'in node_modules'() {
      await outputFiles({
        'node_modules/@dword-design/base-config-nuxt': {},
        'pages/index.vue': endent`
          <template>
            <div class="foo">Hello world</div>
          </template>
        `,
      })
      await fs.copy(
        '../package.json',
        'node_modules/@dword-design/base-config-nuxt/package.json',
      )
      await fs.copy(
        '../src',
        'node_modules/@dword-design/base-config-nuxt/dist',
      )

      const base = new Base({ name: '@dword-design/nuxt' })
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
    }, */
    /* 'local module with options': async () => {
      await outputFiles({
        'config.js': endent`
          export default {
            modules: [
              ['./modules/foo/index.js', { foo: 'foo' }],
            ],
          }
        `,
        'modules/foo': {
          'index.js': endent`
            import { addServerPlugin, createResolver } from '@nuxt/kit'

            const resolver = createResolver(import.meta.url)

            export default (options, nuxt) => addServerPlugin(resolver.resolve('./plugin.js'))
          `,
          'plugin.js': endent`
            import { defineNitroPlugin } from '#imports'

            export default defineNitroPlugin(() => {})
          `,
        },
      })

      const base = new Base({ name: '../src/index.js' })
      await base.prepare()

      const childProcess = base.run('dev')
      try {
        await nuxtDevReady()
        await axios.get('http://localhost:3000')
      } finally {
        await kill(childProcess.pid)
      }
    }, */
    async 'locale link'() {
      await outputFiles({
        i18n: { 'de.json': JSON.stringify({}), 'en.json': JSON.stringify({}) },
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
      });

      const base = new Base({ name: '../src/index.js' });
      await base.prepare();
      const childProcess = base.run('dev');

      try {
        await nuxtDevReady();
        await this.page.goto('http://localhost:3000');

        expect(await this.page.$eval('a', a => a.getAttribute('href'))).toEqual(
          '/en/foo',
        );
      } finally {
        await kill(childProcess.pid);
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
      });

      const base = new Base({ name: '../src/index.js' });
      await base.prepare();
      const childProcess = base.run('dev');

      try {
        await nuxtDevReady();
        await this.page.goto('http://localhost:3000');
        await this.page.waitForFunction(() => document.title === 'Test-App');
      } finally {
        await kill(childProcess.pid);
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
      });

      const base = new Base({ name: '../src/index.js' });
      await base.prepare();
      const childProcess = base.run('dev');

      try {
        await nuxtDevReady();
        await this.page.goto('http://localhost:3000');

        await this.page.waitForFunction(
          () => document.title === 'Test-App: This is the ultimate app!',
        );
      } finally {
        await kill(childProcess.pid);
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
      });

      const base = new Base({ name: '../src/index.js' });
      await base.prepare();
      const childProcess = base.run('dev');

      try {
        await nuxtDevReady();
        await this.page.goto('http://localhost:3000');

        const handle = await this.page.waitForSelector(
          'meta[name=og\\:image]',
          { state: 'attached' },
        );

        expect(await handle.evaluate(meta => meta.content)).toEqual(
          'https://example.com/og-image',
        );
      } finally {
        await kill(childProcess.pid);
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
      });

      const base = new Base({ name: '../src/index.js' });
      await base.prepare();
      const childProcess = base.run('dev');

      try {
        await nuxtDevReady();
        await this.page.goto('http://localhost:3000/foo');

        await this.page.waitForFunction(
          () => document.title === 'Foo page | Test-App',
        );
      } finally {
        await kill(childProcess.pid);
      }
    },
    async 'pipeline operator await in vue'() {
      await fs.outputFile(
        'pages/index.vue',
        endent`
          <template>
            <div class="foo">{{ foo }}</div>
          </template>

          <script setup>
          const foo = Promise.resolve(1) |> await |> x => x * 2
          </script>
        `,
      );

      const base = new Base({ name: '../src/index.js' });
      await base.prepare();
      const childProcess = base.run('dev');

      try {
        await nuxtDevReady();
        await this.page.goto('http://localhost:3000');
        const foo = await this.page.waitForSelector('.foo');
        expect(await foo.evaluate(el => el.innerText)).toEqual('2');
      } finally {
        await kill(childProcess.pid);
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
      });

      const base = new Base({ name: '../src/index.js' });
      await base.prepare();
      const childProcess = base.run('dev');

      try {
        await nuxtDevReady(3005);
        await this.page.goto('http://localhost:3005');
        await this.page.waitForSelector('.foo', { state: 'attached' });
      } finally {
        await kill(childProcess.pid);
      }
    },
    async 'request body'() {
      await outputFiles({
        'package.json': JSON.stringify({
          dependencies: { '@dword-design/functions': '*', h3: '*' },
          type: 'module',
        }),
        'pages/index.vue': endent`
          <template>
            <form method="POST" :class="{ sent }">
              <button name="submit" type="submit">Send</button>
            </form>
          </template>

          <script setup>
          import { property } from '@dword-design/functions'
          import { useRequestEvent } from '#imports'
          import { getMethod, readBody } from 'h3'

          const event = useRequestEvent()

          const sent = event && getMethod(event) === 'POST' && (readBody(event) |> await |> property('submit')) !== undefined
          </script>
        `,
      });

      const base = new Base({ name: '../src/index.js' });
      await base.prepare();
      const childProcess = base.run('dev');

      try {
        await nuxtDevReady();
        await this.page.goto('http://localhost:3000');
        const button = await this.page.waitForSelector('button');
        await button.evaluate(el => el.click());
        await this.page.waitForSelector('form.sent');
      } finally {
        await kill(childProcess.pid);
      }
    },
    async 'router config'() {
      await outputFiles({
        'config.js': endent`
          export default {
            router: {
              options: {
                linkActiveClass: 'is-active',
              },
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
      });

      const base = new Base({ name: '../src/index.js' });
      await base.prepare();
      const childProcess = base.run('dev');

      try {
        await nuxtDevReady();
        await this.page.goto('http://localhost:3000');

        await this.page.waitForSelector('.foo.is-active', {
          state: 'attached',
        });
      } finally {
        await kill(childProcess.pid);
      }
    },
    async 'scoped style in production'() {
      await fs.outputFile(
        'pages/index.vue',
        endent`
          <template>
            <div class="foo" />
          </template>

          <style scoped>
          .foo {
            background: red;
          }
          </style>
        `,
      );

      const base = new Base({ name: '../src/index.js' });
      await base.prepare();
      await base.run('prepublishOnly');
      const childProcess = base.run('start');

      try {
        await portReady(3000);
        await this.page.goto('http://localhost:3000');

        expect(
          await this.page.$eval(
            '.foo',
            el => getComputedStyle(el).backgroundColor,
          ),
        ).toEqual('rgb(255, 0, 0)');
      } finally {
        await kill(childProcess.pid);
      }
    },
    async sitemap() {
      await outputFiles({
        'config.js': endent`
          export default {
            modules: [
              ['${packageName`@nuxtjs/sitemap`}', { credits: false }],
            ],
            site: { url: 'https://example.com' },
          }
        `,
        i18n: { 'de.json': JSON.stringify({}), 'en.json': JSON.stringify({}) },
        'pages/index.vue': endent`
          <template>
            <div class="foo">Hello world</div>
          </template>
        `,
      });

      const base = new Base({ name: '../src/index.js' });
      await base.prepare();
      const childProcess = base.run('dev');

      try {
        await nuxtDevReady();

        const sitemap =
          (await axios.get('http://localhost:3000/sitemap.xml?canonical'))
          |> await
          |> property('data');

        expect(
          xmlFormatter(sitemap, {
            collapseContent: true,
            indentation: '  ',
            lineSeparator: '\n',
          }),
        ).toMatchSnapshot(this);
      } finally {
        await kill(childProcess.pid);
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
      });

      const base = new Base({ name: '../src/index.js' });
      await base.prepare();
      const childProcess = base.run('dev');

      try {
        await nuxtDevReady();
        await this.page.goto('http://localhost:3000');
        const icon = await this.page.waitForSelector('.icon');
        expect(await icon.evaluate(el => el.tagName)).toEqual('svg');
      } finally {
        await kill(childProcess.pid);
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
      });

      const base = new Base({ name: '../src/index.js' });
      await base.prepare();
      const childProcess = base.run('dev');

      try {
        await nuxtDevReady();
        await this.page.goto('http://localhost:3000');
        const image = await this.page.waitForSelector('.image');
        expect(await image.evaluate(el => el.tagName)).toEqual('IMG');

        expect(await image.evaluate(el => el.getAttribute('src'))).toEqual(
          "data:image/svg+xml,%3csvg%20xmlns='http://www.w3.org/2000/svg'%20/%3e",
        );
      } finally {
        await kill(childProcess.pid);
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
      });

      const base = new Base({ name: '../src/index.js' });
      await base.prepare();
      const childProcess = base.run('dev');

      try {
        await nuxtDevReady();
        await this.page.goto('http://localhost:3000');

        await this.page.waitForSelector(
          'meta[name=viewport][content$=user-scalable\\=0]',
          { state: 'attached' },
        );
      } finally {
        await kill(childProcess.pid);
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
      );

      const base = new Base({ name: '../src/index.js' });
      await base.prepare();
      const childProcess = base.run('dev');

      try {
        await nuxtDevReady();
        await this.page.goto('http://localhost:3000');
        const handle = await this.page.waitForSelector('.foo');

        expect(await handle.evaluate(div => div.textContent)).toEqual(
          'Hello world',
        );
      } finally {
        await kill(childProcess.pid);
      }
    },
  },
  [
    testerPluginTmpDir(),
    {
      async after() {
        await this.browser.close();
      },
      async afterEach() {
        await this.page.close();
      },
      async before() {
        this.browser = await chromium.launch();
      },
      async beforeEach() {
        this.page = await this.browser.newPage();
      },
    },
  ],
);
