import pathLib from 'node:path';

import { Base } from '@dword-design/base';
import { endent, property } from '@dword-design/functions';
import { expect, test } from '@playwright/test';
import axios from 'axios';
import packageName from 'depcheck-package-name';
import fs from 'fs-extra';
import nuxtDevReady from 'nuxt-dev-ready';
import outputFiles from 'output-files';
import portReady from 'port-ready';
import kill from 'tree-kill-promise';
import xmlFormatter from 'xml-formatter';
import config from './index.js';

test('aliases', async ({ page }, testInfo) => {
  const cwd = testInfo.outputPath('');

  await outputFiles(cwd, {
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

  const base = new Base(config, { cwd });
  await base.prepare();
  const childProcess = base.run('dev');

  try {
    await nuxtDevReady();
    await page.goto('http://localhost:3000');
    const foo = page.locator('.foo');
    await expect(foo).toBeAttached();
    expect(await foo.evaluate(div => div.textContent)).toEqual('Hello world');
  } finally {
    await kill(childProcess.pid);
  }
});

test('api', async ({}, testInfo) => {
  const cwd = testInfo.outputPath('');

  await fs.outputFile(
    pathLib.join(cwd, 'server', 'api', 'foo.get.js'),
    "export default defineEventHandler(() => ({ foo: 'bar' }))",
  );

  const base = new Base(config, { cwd });
  await base.prepare();
  const childProcess = base.run('dev');

  try {
    await nuxtDevReady();

    const result =
      axios.get('http://localhost:3000/api/foo') |> await |> property('data');

    expect(result).toEqual({ foo: 'bar' });
  } finally {
    await kill(childProcess.pid);
  }
});

test('async modules', async ({ page }, testInfo) => {
  const cwd = testInfo.outputPath('');

  await outputFiles(cwd, {
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

  const base = new Base(config, { cwd });
  await base.prepare();
  const childProcess = base.run('dev');

  try {
    await nuxtDevReady();
    await page.goto('http://localhost:3000');
    const foo = page.locator('.foo');
    await expect(foo).toBeAttached();
    expect(await foo.evaluate(el => el.textContent)).toEqual('Hello world');
  } finally {
    await kill(childProcess.pid);
  }
});

test('basic auth', async ({}, testInfo) => {
  const cwd = testInfo.outputPath('');

  await outputFiles(cwd, {
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
    'server/api/foo.get.js': "export default defineEventHandler(() => 'foo')",
  });

  const base = new Base(config, { cwd });
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
});

test('bodyAttrs', async ({ page }, testInfo) => {
  const cwd = testInfo.outputPath('');

  await outputFiles(cwd, {
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

  const base = new Base(config, { cwd });
  await base.prepare();
  const childProcess = base.run('dev');

  try {
    await nuxtDevReady();
    await page.goto('http://localhost:3000');

    expect(
      await page.evaluate(() => document.body.classList.contains('foo')),
    ).toEqual(true);
  } finally {
    await kill(childProcess.pid);
  }
});

test('css', async ({ page }, testInfo) => {
  const cwd = testInfo.outputPath('');

  await outputFiles(cwd, {
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

  const base = new Base(config, { cwd });
  await base.prepare();
  const childProcess = base.run('dev');

  try {
    await nuxtDevReady();
    await page.goto('http://localhost:3000');
    const foo = page.locator('.foo');
    await expect(foo).toBeAttached();

    expect(foo.evaluate(el => getComputedStyle(el).backgroundColor)).toEqual(
      'rgb(255, 0, 0)',
    );
  } finally {
    await kill(childProcess.pid);
  }
});

test('css modules', async ({ page }, testInfo) => {
  const cwd = testInfo.outputPath('');

  await outputFiles(cwd, {
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

  const base = new Base(config, { cwd });
  await base.prepare();
  const childProcess = base.run('dev');

  try {
    await nuxtDevReady();
    await page.goto('http://localhost:3000');
    const foo = page.locator('.foo');
    await expect(foo).toBeAttached();

    expect(
      await foo.evaluate(el => getComputedStyle(el).backgroundColor),
    ).toEqual('rgb(255, 0, 0)');
  } finally {
    await kill(childProcess.pid);
  }
});

test('do not import image urls in production', async ({}, testInfo) => {
  const cwd = testInfo.outputPath('');

  await outputFiles(cwd, {
    'pages/index.vue': endent`
      <template>
        <img src="/api/foo.png" />
      </template>
    `,
  });

  const base = new Base(config, { cwd });
  await base.prepare();
  await base.run('prepublishOnly');
  const nuxt = base.run('start');

  try {
    await portReady(3000);
  } finally {
    await kill(nuxt.pid);
  }
});

test('do not transpile other language than js in vue', async ({
  page,
}, testInfo) => {
  const cwd = testInfo.outputPath('');

  await fs.outputFile(
    pathLib.join(cwd, 'pages', 'index.vue'),
    endent`
      <template>
        <div class="foo">{{ foo }}</div>
      </template>

      <script setup lang="ts">
      const foo: number = 2
      </script>
    `,
  );

  const base = new Base(config, { cwd });
  await base.prepare();
  const childProcess = base.run('dev');

  try {
    await nuxtDevReady();
    await page.goto('http://localhost:3000');
    const foo = page.locator('.foo');
    await expect(foo).toBeAttached();
    expect(await foo.evaluate(el => el.textContent)).toEqual('2');
  } finally {
    await kill(childProcess.pid);
  }
});

test('dotenv: config', async ({ page }, testInfo) => {
  const cwd = testInfo.outputPath('');

  await outputFiles(cwd, {
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

  const base = new Base(config, { cwd });
  await base.prepare();
  const childProcess = base.run('dev');

  try {
    await nuxtDevReady();
    await page.goto('http://localhost:3000');
    expect(await page.evaluate(() => document.title)).toEqual('Bar');
  } finally {
    await kill(childProcess.pid);
  }
});

test('dotenv: module', async ({}, testInfo) => {
  const cwd = testInfo.outputPath('');

  await outputFiles(cwd, {
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

  const base = new Base(config, { cwd });
  await base.prepare();
  await base.run('prepublishOnly');
});

test('global components', async ({ page }, testInfo) => {
  const cwd = testInfo.outputPath('');

  await outputFiles(cwd, {
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

  const base = new Base(config, { cwd });
  await base.prepare();
  const childProcess = base.run('dev');

  try {
    await nuxtDevReady();
    await page.goto('http://localhost:3000');
    const foo = page.locator('.foo');
    await expect(foo).toBeAttached();
    expect(await foo.evaluate(div => div.textContent)).toEqual('Hello world');
  } finally {
    await kill(childProcess.pid);
  }
});

test('head in module', async ({}, testInfo) => {
  const cwd = testInfo.outputPath('');

  await fs.outputFile(
    pathLib.join(cwd, 'modules', 'mod.js'),
    "export default (options, nuxt) => nuxt.options.app.head.script.push('foo')",
  );

  const base = new Base(config, { cwd });
  await base.prepare();
  await base.run('prepublishOnly');
});

test('head link', async ({ page }, testInfo) => {
  const cwd = testInfo.outputPath('');

  await outputFiles(cwd, {
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

  const base = new Base(config, { cwd });
  await base.prepare();
  const childProcess = base.run('dev');

  try {
    await nuxtDevReady();
    await page.goto('http://localhost:3000');
    const link = page.locator('link[rel=alternate]');
    await expect(link).toBeAttached();

    await Promise.all([
      expect(link).toHaveAttribute('rel', 'alternate'),
      expect(link).toHaveAttribute('type', 'application/rss+xml'),
      expect(link).toHaveAttribute('title', 'Blog'),
      expect(link).toHaveAttribute('href', '/feed'),
    ]);
  } finally {
    await kill(childProcess.pid);
  }
});

test('hexrgba', async ({ page }, testInfo) => {
  const cwd = testInfo.outputPath('');

  await outputFiles(cwd, {
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

  const base = new Base(config, { cwd });
  await base.prepare();
  const childProcess = base.run('dev');

  try {
    await nuxtDevReady();
    await page.goto('http://localhost:3000');

    await page.waitForFunction(
      () =>
        getComputedStyle(document.body).backgroundColor === 'rgba(0, 0, 0, 0)',
    );
  } finally {
    await kill(childProcess.pid);
  }
});

test('htmlAttrs', async ({ page }, testInfo) => {
  const cwd = testInfo.outputPath('');

  await outputFiles(cwd, {
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

  const base = new Base(config, { cwd });
  await base.prepare();
  const childProcess = base.run('dev');

  try {
    await nuxtDevReady();
    await page.goto('http://localhost:3000');
    await expect(page.locator('html.foo')).toBeAttached();
  } finally {
    await kill(childProcess.pid);
  }
});

test('i18n: browser language changed', async ({}, testInfo) => {
  const cwd = testInfo.outputPath('');

  await outputFiles(cwd, {
    i18n: { 'de.json': JSON.stringify({}), 'en.json': JSON.stringify({}) },
    'pages/index.vue': endent`
      <template>
        <div />
      </template>
    `,
  });

  const base = new Base(config, { cwd });
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
});

test('i18n: change page, meta up-to-date', async ({ page }, testInfo) => {
  const cwd = testInfo.outputPath('');

  await outputFiles(cwd, {
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

  const base = new Base(config, { cwd });
  await base.prepare();
  const childProcess = base.run('dev');

  try {
    await nuxtDevReady();
    await page.goto('http://localhost:3000');

    await expect(
      page.locator('link[rel=canonical][href="http://localhost:3000"]'),
    ).toBeAttached();

    await page.goto('http://localhost:3000/foo');

    await expect(
      page.locator('link[rel=canonical][href="http://localhost:3000/foo"]'),
    ).toBeAttached();
  } finally {
    await kill(childProcess.pid);
  }
});

test('i18n: middleware', async ({ page }, testInfo) => {
  const cwd = testInfo.outputPath('');

  await outputFiles(cwd, {
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

  const base = new Base(config, { cwd });
  await base.prepare();
  const childProcess = base.run('dev');

  try {
    await nuxtDevReady();
    await page.goto('http://localhost:3000');
    const foo = page.locator('.foo');
    await expect(foo).toBeAttached();
    expect(await foo.evaluate(div => div.textContent)).toEqual('Hello world');
  } finally {
    await kill(childProcess.pid);
  }
});

test('i18n: root with prefix', async ({ page }, testInfo) => {
  const cwd = testInfo.outputPath('');

  await outputFiles(cwd, {
    i18n: { 'de.json': JSON.stringify({}), 'en.json': JSON.stringify({}) },
    'pages/index.vue': endent`
      <template>
        <div />
      </template>
    `,
  });

  const base = new Base(config, { cwd });
  await base.prepare();
  const childProcess = base.run('dev');

  try {
    await nuxtDevReady();
    await page.goto('http://localhost:3000/de');
    expect(page.url()).toEqual('http://localhost:3000/de');
  } finally {
    await kill(childProcess.pid);
  }
});

test('i18n: root without prefix', async ({ page }, testInfo) => {
  const cwd = testInfo.outputPath('');

  await outputFiles(cwd, {
    i18n: { 'de.json': JSON.stringify({}), 'en.json': JSON.stringify({}) },
    'pages/index.vue': endent`
      <template>
        <div />
      </template>
    `,
  });

  const base = new Base(config, { cwd });
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

    await page.setExtraHTTPHeaders({ 'Accept-Language': 'de' });
  } finally {
    await kill(childProcess.pid);
  }
});

test('i18n: route with prefix', async ({}, testInfo) => {
  const cwd = testInfo.outputPath('');

  await outputFiles(cwd, {
    i18n: { 'de.json': JSON.stringify({}), 'en.json': JSON.stringify({}) },
    'pages/foo.vue': endent`
      <template>
        <div />
      </template>
    `,
  });

  const base = new Base(config, cwd);
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
});

test('i18n: route without prefix', async ({}, testInfo) => {
  const cwd = testInfo.outputPath('');

  await outputFiles(cwd, {
    i18n: { 'de.json': JSON.stringify({}), 'en.json': JSON.stringify({}) },
    'pages/foo.vue': endent`
      <template>
        <div />
      </template>
    `,
  });

  const base = new Base(config, { cwd });
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
});

test('i18n: single locale', async ({ page }, testInfo) => {
  const cwd = testInfo.outputPath('');

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

  const base = new Base(config, { cwd });
  await base.prepare();
  const childProcess = base.run('dev');

  try {
    await nuxtDevReady();
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'en' });
    await page.goto('http://localhost:3000');
    expect(page.url()).toEqual('http://localhost:3000/');
    const link = page.locator('.foo');
    await expect(link).toBeAttached();
    expect(await link.evaluate(el => el.textContent)).toEqual('bar');

    expect(await link.evaluate(el => el.href)).toEqual(
      'http://localhost:3000/bar',
    );
  } finally {
    await kill(childProcess.pid);
  }
});

test('i18n: works', async ({ page }, testInfo) => {
  const cwd = testInfo.outputPath('');

  await outputFiles(cwd, {
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

  const base = new Base(config, { cwd });
  await base.prepare();
  const childProcess = base.run('dev');

  try {
    await nuxtDevReady();
    await page.goto('http://localhost:3000');
    expect(page.url()).toEqual('http://localhost:3000/en');
    const foo = page.locator('.foo');
    const html = page.locator('html[lang=en]');

    await Promise.all([
      expect(foo).toBeAttached(),
      expect(html).toBeAttached(),
      expect(
        page.locator('link[rel=canonical][href="http://localhost:3000/en"]'),
      ).toBeAttached(),
      expect(
        page.locator(
          'link[rel=alternate][href="http://localhost:3000/de"][hreflang=de]',
        ),
      ).toBeAttached(),
      expect(
        page.locator(
          'link[rel=alternate][href="http://localhost:3000/en"][hreflang=en]',
        ),
      ).toBeAttached(),
      expect(
        page.locator(
          'link[rel=icon][type="image/x-icon"][href="/favicon.ico"]',
        ),
      ).toBeAttached(),
    ]);

    expect(await foo.evaluate(div => div.textContent)).toEqual('Hello world');
    await expect(html).toHaveAttribute('style', 'background:red');
  } finally {
    await kill(childProcess.pid);
  }
});

test('locale link', async ({ page }, testInfo) => {
  const cwd = testInfo.outputPath('');

  await outputFiles(cwd, {
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

  const base = new Base(config, { cwd });
  await base.prepare();
  const childProcess = base.run('dev');

  try {
    await nuxtDevReady();
    await page.goto('http://localhost:3000');
    await expect(page.locator('a')).toHaveAttribute('href', '/en/foo');
  } finally {
    await kill(childProcess.pid);
  }
});

test('name', async ({ page }, testInfo) => {
  const cwd = testInfo.outputPath('');

  await outputFiles(cwd, {
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

  const base = new Base(config, { cwd });
  await base.prepare();
  const childProcess = base.run('dev');

  try {
    await nuxtDevReady();
    await page.goto('http://localhost:3000');
    await page.waitForFunction(() => document.title === 'Test-App');
  } finally {
    await kill(childProcess.pid);
  }
});

test('name and title', async ({ page }, testInfo) => {
  const cwd = testInfo.outputPath('');

  await outputFiles(cwd, {
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

  const base = new Base(config, { cwd });
  await base.prepare();
  const childProcess = base.run('dev');

  try {
    await nuxtDevReady();
    await page.goto('http://localhost:3000');

    await page.waitForFunction(
      () => document.title === 'Test-App: This is the ultimate app!',
    );
  } finally {
    await kill(childProcess.pid);
  }
});

test('ogImage', async ({ page }, testInfo) => {
  const cwd = testInfo.outputPath('');

  await outputFiles(cwd, {
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

  const base = new Base(config, { cwd });
  await base.prepare();
  const childProcess = base.run('dev');

  try {
    await nuxtDevReady();
    await page.goto('http://localhost:3000');
    const meta = page.locator(String.raw`meta[name=og\:image]`);
    await expect(meta).toBeAttached();

    expect(await meta.evaluate(meta => meta.content)).toEqual(
      'https://example.com/og-image',
    );
  } finally {
    await kill(childProcess.pid);
  }
});

test('page with title', async ({ page }, testInfo) => {
  const cwd = testInfo.outputPath('');

  await outputFiles(cwd, {
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

  const base = new Base(config, { cwd });
  await base.prepare();
  const childProcess = base.run('dev');

  try {
    await nuxtDevReady();
    await page.goto('http://localhost:3000/foo');
    await page.waitForFunction(() => document.title === 'Foo page | Test-App');
  } finally {
    await kill(childProcess.pid);
  }
});

test('port', async ({ page }, testInfo) => {
  const cwd = testInfo.outputPath('');

  await outputFiles(cwd, {
    '.env.schema.json': JSON.stringify({ port: { type: 'integer' } }),
    '.test.env.json': JSON.stringify({ port: 3005 }),
    'pages/index.vue': endent`
      <template>
        <div class="foo" />
      </template>
    `,
  });

  const base = new Base(config);
  await base.prepare();
  const childProcess = base.run('dev');

  try {
    await nuxtDevReady(3005);
    await page.goto('http://localhost:3005');
    await expect(page.locator('.foo')).toBeAttached();
  } finally {
    await kill(childProcess.pid);
  }
});

test('request body', async ({ page }, testInfo) => {
  const cwd = testInfo.outputPath('');

  await outputFiles(cwd, {
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
      import { property } from '@dword-design/functions';
      import { getMethod, readBody } from 'h3';

      const event = useRequestEvent();

      const sent = event && getMethod(event) === 'POST' && (await readBody(event)).submit !== undefined;
      </script>
    `,
  });

  const base = new Base(config, { cwd });
  await base.prepare();
  const childProcess = base.run('dev');

  try {
    await nuxtDevReady();
    await page.goto('http://localhost:3000');
    await page.locator('button').click();
    await expect(page.locator('form')).toContainClass('sent');
  } finally {
    await kill(childProcess.pid);
  }
});

test('router config', async ({ page }, testInfo) => {
  const cwd = testInfo.outputPath('');

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

  const base = new Base(config, { cwd });
  await base.prepare();
  const childProcess = base.run('dev');

  try {
    await nuxtDevReady();
    await page.goto('http://localhost:3000');
    await expect(page.locator('.foo.is-active')).toBeAttached();
  } finally {
    await kill(childProcess.pid);
  }
});

test('scoped style in production', async ({ page }, testInfo) => {
  const cwd = testInfo.outputPath('');

  await fs.outputFile(
    pathLib.join(cwd, 'pages', 'index.vue'),
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

  const base = new Base(config, { cwd });
  await base.prepare();
  await base.run('prepublishOnly');
  const childProcess = base.run('start');

  try {
    await portReady(3000);
    await page.goto('http://localhost:3000');

    expect(
      await page
        .locator('.foo')
        .evaluate(el => getComputedStyle(el).backgroundColor),
    ).toEqual('rgb(255, 0, 0)');
  } finally {
    await kill(childProcess.pid);
  }
});

test('sitemap', async ({}, testInfo) => {
  const cwd = testInfo.outputPath('');

  await outputFiles(cwd, {
    'config.js': endent`
      export default {
        modules: [
          ['${packageName`@nuxtjs/sitemap`}', { credits: false }],
        ],
        site: { url: 'https://example.com' },
      };
    `,
    i18n: { 'de.json': JSON.stringify({}), 'en.json': JSON.stringify({}) },
    'pages/index.vue': endent`
      <template>
        <div class="foo">Hello world</div>
      </template>
    `,
  });

  const base = new Base(config, { cwd });
  await base.prepare();
  const childProcess = base.run('dev');

  try {
    await nuxtDevReady();

    const { data: sitemap } = await axios.get(
      'http://localhost:3000/sitemap.xml?canonical',
    );

    expect(
      xmlFormatter(sitemap, {
        collapseContent: true,
        indentation: '  ',
        lineSeparator: '\n',
      }),
    ).toMatchSnapshot();
  } finally {
    await kill(childProcess.pid);
  }
});

test('svg inline', async ({ page }, testInfo) => {
  const cwd = testInfo.outputPath('');

  await outputFiles(cwd, {
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

  const base = new Base(config, { cwd });
  await base.prepare();
  const childProcess = base.run('dev');

  try {
    await nuxtDevReady();
    await page.goto('http://localhost:3000');
    const icon = page.locator('.icon');
    await expect(icon).toBeAttached();
    expect(await icon.evaluate(el => el.tagName)).toEqual('svg');
  } finally {
    await kill(childProcess.pid);
  }
});

test('svg url', async ({ page }, testInfo) => {
  const cwd = testInfo.outputPath('');

  await outputFiles(cwd, {
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

  const base = new Base(config, { cwd });
  await base.prepare();
  const childProcess = base.run('dev');

  try {
    await nuxtDevReady();
    await page.goto('http://localhost:3000');
    const image = page.locator('.image');
    await expect(image).toBeAttached();
    expect(await image.evaluate(el => el.tagName)).toEqual('IMG');

    await expect(image).toHaveAttribute(
      'src',
      "data:image/svg+xml,%3csvg%20xmlns='http://www.w3.org/2000/svg'%20/%3e",
    );
  } finally {
    await kill(childProcess.pid);
  }
});

test('userScalable', async ({ page }, testInfo) => {
  const cwd = testInfo.outputPath('');

  await outputFiles(cwd, {
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

  const base = new Base(config, { cwd });
  await base.prepare();
  const childProcess = base.run('dev');

  try {
    await nuxtDevReady();
    await page.goto('http://localhost:3000');

    await expect(
      page.locator(String.raw`meta[name=viewport][content$=user-scalable\=0]`, {
        state: 'attached',
      }),
    ).toBeAttached();
  } finally {
    await kill(childProcess.pid);
  }
});

test('valid', async ({ page }, testInfo) => {
  const cwd = testInfo.outputPath('');

  await fs.outputFile(
    pathLib.join(cwd, 'pages', 'index.vue'),
    endent`
      <template>
        <div class="foo">Hello world</div>
      </template>
    `,
  );

  const base = new Base(config, { cwd });
  await base.prepare();
  const childProcess = base.run('dev');

  try {
    await nuxtDevReady();
    await page.goto('http://localhost:3000');
    const foo = page.locator('.foo');
    await expect(foo).toBeAttached();
    expect(await foo.evaluate(div => div.textContent)).toEqual('Hello world');
  } finally {
    await kill(childProcess.pid);
  }
});
