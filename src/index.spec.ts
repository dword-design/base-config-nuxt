import pathLib from 'node:path';

import { Base } from '@dword-design/base';
import { expect, test } from '@playwright/test';
import axios from 'axios';
import packageName from 'depcheck-package-name';
import endent from 'endent';
import fs from 'fs-extra';
import getPort from 'get-port';
import nuxtDevReady from 'nuxt-dev-ready';
import outputFiles from 'output-files';
import portReady from 'port-ready';
import kill from 'tree-kill-promise';
import xmlFormatter from 'xml-formatter';

import config from '.';

test('basic auth', async ({}, testInfo) => {
  const cwd = testInfo.outputPath();

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
    'server/api/foo.get.ts': "export default defineEventHandler(() => 'foo')",
    'server/middleware/basic-auth.ts': endent`
      export default defineEventHandler(event => {
        if (
          event.node.req.headers?.["x-nitro-prerender"] &&
          import.meta.env.NODE_ENV === "prerender"
        ) {
          return;
        }

        let authenticated = false;

        const credentials = event.node.req.headers?.authorization?.split(" ")[1];

        if (credentials) {
          const [username, password] = Buffer.from(credentials, "base64")
            .toString("utf8")
            .split(":");

          authenticated = username === 'foo' && password === 'bar';
        }

        if (!authenticated) {
          event.node.res.setHeader(
            "WWW-Authenticate",
            'Basic realm="Secure Area", charset="UTF-8"',
          );
          event.node.res.statusCode = 401;
          event.node.res.end("Access denied");
        }
      });
    `,
  });

  const base = new Base(config, { cwd });
  await base.prepare();
  const port = await getPort();

  const nuxt = base.run('dev', {
    env: { NODE_ENV: '', PORT: port },
    log: true,
  });

  try {
    await nuxtDevReady(port);
    console.log('port ready');

    await axios.get(`http://localhost:${port}`, {
      auth: { password: 'bar', username: 'foo' },
    });

    console.log('response not 401');
  } catch (error) {
    console.log(error);
    throw error;
  } finally {
    console.log('test done');
    await kill(nuxt.pid);
    console.log('killed');
  }
});

test('aliases', async ({ page }, testInfo) => {
  const cwd = testInfo.outputPath();

  await outputFiles(cwd, {
    'model/foo.ts': "export default 'Hello world'",
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
  const port = await getPort();
  const nuxt = base.run('dev', { env: { PORT: port } });

  try {
    await nuxtDevReady(port);
    await page.goto(`http://localhost:${port}`);
    const foo = page.locator('.foo');
    await expect(foo).toHaveText('Hello world');
  } finally {
    await kill(nuxt.pid);
  }
});

test('api', async ({}, testInfo) => {
  const cwd = testInfo.outputPath();

  await fs.outputFile(
    pathLib.join(cwd, 'server', 'api', 'foo.get.ts'),
    "export default defineEventHandler(() => ({ foo: 'bar' }))",
  );

  const base = new Base(config, { cwd });
  await base.prepare();
  const port = await getPort();
  const nuxt = base.run('dev', { env: { PORT: port } });

  try {
    await nuxtDevReady(port);

    const { data: result } = await axios.get(
      `http://localhost:${port}/api/foo`,
    );

    expect(result).toEqual({ foo: 'bar' });
  } finally {
    await kill(nuxt.pid);
  }
});

test('async modules', async ({ page }, testInfo) => {
  const cwd = testInfo.outputPath();

  await outputFiles(cwd, {
    'modules/foo': {
      'index.ts': endent`
        import delay from '${packageName`delay`}'
        import { addPlugin, createResolver } from '@nuxt/kit'

        const resolver = createResolver(import.meta.url)

        export default async function () {
          await delay(100);
          addPlugin(resolver.resolve('./plugin'), { append: true });
        }
      `,
      'plugin.ts':
        "export default defineNuxtPlugin(() => ({ provide: { foo: 'Hello world' } }))",
    },
    'pages/index.vue': endent`
      <template>
        <div class="foo">{{ $foo }}</div>
      </template>

      <script setup lang="ts">
      const { $foo } = useNuxtApp()
      </script>
    `,
  });

  const base = new Base(config, { cwd });
  await base.prepare();
  const port = await getPort();

  const nuxt = base.run('dev', {
    env: { NODE_ENV: '', PORT: port },
    log: true,
  });

  try {
    await nuxtDevReady(port);
    await page.goto(`http://localhost:${port}`);
    await expect(page.locator('.foo')).toHaveText('Hello world');
  } finally {
    await kill(nuxt.pid);
  }
});

test('bodyAttrs', async ({ page }, testInfo) => {
  const cwd = testInfo.outputPath();

  await outputFiles(cwd, {
    'config.ts': endent`
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
      </template>\n
    `,
  });

  const base = new Base(config, { cwd });
  await base.prepare();
  const port = await getPort();
  const nuxt = base.run('dev', { env: { PORT: port } });

  try {
    await nuxtDevReady(port);
    await page.goto(`http://localhost:${port}`);
    await expect(page.locator('body')).toContainClass('foo');
  } finally {
    await kill(nuxt.pid);
  }
});

test('css', async ({ page }, testInfo) => {
  const cwd = testInfo.outputPath();

  await outputFiles(cwd, {
    'assets/style.scss': endent`
      .foo {
        background: red;
      }
    `,
    'config.ts': endent`
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
  const port = await getPort();
  const nuxt = base.run('dev', { env: { PORT: port } });

  try {
    await nuxtDevReady(port);
    await page.goto(`http://localhost:${port}`);
    const foo = page.locator('.foo');
    await expect(foo).toBeAttached();

    expect(
      await foo.evaluate(el => getComputedStyle(el).backgroundColor),
    ).toEqual('rgb(255, 0, 0)');
  } finally {
    await kill(nuxt.pid);
  }
});

test('css modules', async ({ page }, testInfo) => {
  const cwd = testInfo.outputPath();

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
  const port = await getPort();
  const nuxt = base.run('dev', { env: { PORT: port } });

  try {
    await nuxtDevReady(port);
    await page.goto(`http://localhost:${port}`);
    const foo = page.locator('.foo');
    await expect(foo).toBeAttached();

    expect(
      await foo.evaluate(el => getComputedStyle(el).backgroundColor),
    ).toEqual('rgb(255, 0, 0)');
  } finally {
    await kill(nuxt.pid);
  }
});

test('do not import image urls in production', async ({}, testInfo) => {
  const cwd = testInfo.outputPath();

  await outputFiles(cwd, {
    'pages/index.vue': endent`
      <template>
        <img src="/api/foo.png" />
      </template>
    `,
  });

  const base = new Base(config, { cwd });
  await base.prepare();
  const port = await getPort();
  await base.run('prepublishOnly');
  const nuxt = base.run('start', { env: { PORT: port } });

  try {
    await portReady(port);
  } finally {
    await kill(nuxt.pid);
  }
});

test('do not transpile other language than js in vue', async ({
  page,
}, testInfo) => {
  const cwd = testInfo.outputPath();

  await fs.outputFile(
    pathLib.join(cwd, 'pages', 'index.vue'),
    endent`
      <template>
        <div class="foo">{{ foo }}</div>
      </template>

      <script setup lang="ts">
      const foo: number = 2;
      </script>
    `,
  );

  const base = new Base(config, { cwd });
  await base.prepare();
  const port = await getPort();
  const nuxt = base.run('dev', { env: { PORT: port } });

  try {
    await nuxtDevReady(port);
    await page.goto(`http://localhost:${port}`);
    await expect(page.locator('.foo')).toHaveText('2');
  } finally {
    await kill(nuxt.pid);
  }
});

test('dotenv: config', async ({ page }, testInfo) => {
  const cwd = testInfo.outputPath();

  await outputFiles(cwd, {
    '.env.json': JSON.stringify({ foo: 'Foo' }),
    '.env.schema.json': JSON.stringify({ foo: { type: 'string' } }),
    '.test.env.json': JSON.stringify({ foo: 'Bar' }),
    'config.ts': endent`
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
  const port = await getPort();
  const nuxt = base.run('dev', { env: { PORT: port } });

  try {
    await nuxtDevReady(port);
    await page.goto(`http://localhost:${port}`);
    await expect(page).toHaveTitle('Bar');
  } finally {
    await kill(nuxt.pid);
  }
});

test('dotenv: module', async ({ page }, testInfo) => {
  const cwd = testInfo.outputPath();

  await outputFiles(cwd, {
    '.env.schema.json': JSON.stringify({ foo: { type: 'string' } }),
    '.test.env.json': JSON.stringify({ foo: 'bar' }),
    'config.ts': endent`
      export default {
        runtimeConfig: { public: { foo: process.env.FOO } },
      };
    `,
    'pages/index.vue': endent`
      <template>
        <div :class="foo" />
      </template>

      <script setup lang="ts">
      const { public: { foo } } = useRuntimeConfig();
      </script>
    `,
  });

  const base = new Base(config, { cwd });
  await base.prepare();
  const port = await getPort();
  const nuxt = base.run('dev', { env: { PORT: port } });

  try {
    await nuxtDevReady(port);
    await page.goto(`http://localhost:${port}`);
    await expect(page.locator('.bar')).toBeAttached();
  } finally {
    await kill(nuxt.pid);
  }
});

test('global components', async ({ page }, testInfo) => {
  const cwd = testInfo.outputPath();

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
  const port = await getPort();
  const nuxt = base.run('dev', { env: { PORT: port } });

  try {
    await nuxtDevReady(port);
    await page.goto(`http://localhost:${port}`);
    await expect(page.locator('.foo')).toHaveText('Hello world');
  } finally {
    await kill(nuxt.pid);
  }
});

test('head in module', async ({}, testInfo) => {
  const cwd = testInfo.outputPath();

  await outputFiles(cwd, {
    'modules/mod.ts': endent`
      import { defineNuxtModule } from '@nuxt/kit';

      export default defineNuxtModule({
        setup: (options, nuxt) => {
          if (!nuxt.options.app.head.script) {
            nuxt.options.app.head.script = [];
          }
          nuxt.options.app.head.script.push({ src: 'foo' });
        },
      });
    `,
    'package.json': JSON.stringify({ dependencies: { '@nuxt/kit': '*' } }),
  });

  const base = new Base(config, { cwd });
  await base.prepare();
  await base.run('prepublishOnly');
});

test('head link', async ({ page }, testInfo) => {
  const cwd = testInfo.outputPath();

  await outputFiles(cwd, {
    'config.ts': endent`
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
  const port = await getPort();
  const nuxt = base.run('dev', { env: { PORT: port } });

  try {
    await nuxtDevReady(port);
    await page.goto(`http://localhost:${port}`);
    const link = page.locator('link[rel=alternate]');

    await Promise.all([
      expect(link).toHaveAttribute('rel', 'alternate'),
      expect(link).toHaveAttribute('type', 'application/rss+xml'),
      expect(link).toHaveAttribute('title', 'Blog'),
      expect(link).toHaveAttribute('href', '/feed'),
    ]);
  } finally {
    await kill(nuxt.pid);
  }
});

test('hexrgba', async ({ page }, testInfo) => {
  const cwd = testInfo.outputPath();

  await outputFiles(cwd, {
    'assets/style.css': endent`
      body {
        background: rgba(#fff, .5);
      }
    `,
    'config.ts': endent`
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
  const port = await getPort();
  const nuxt = base.run('dev', { env: { PORT: port } });

  try {
    await nuxtDevReady(port);
    await page.goto(`http://localhost:${port}`);

    await page.waitForFunction(
      () =>
        getComputedStyle(document.body).backgroundColor === 'rgba(0, 0, 0, 0)',
    );
  } finally {
    await kill(nuxt.pid);
  }
});

test('htmlAttrs', async ({ page }, testInfo) => {
  const cwd = testInfo.outputPath();

  await outputFiles(cwd, {
    'config.ts': endent`
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
  const port = await getPort();
  const nuxt = base.run('dev', { env: { PORT: port } });

  try {
    await nuxtDevReady(port);
    await page.goto(`http://localhost:${port}`);
    await expect(page.locator('html.foo')).toBeAttached();
  } finally {
    await kill(nuxt.pid);
  }
});

test('i18n', async ({ page }, testInfo) => {
  const cwd = testInfo.outputPath();
  const port = await getPort();

  await outputFiles(cwd, {
    '.env.schema.json': JSON.stringify({ baseUrl: { type: 'string' } }),
    '.test.env.json': JSON.stringify({ baseUrl: `http://localhost:${port}` }),
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
  const nuxt = base.run('dev', { env: { PORT: port } });

  try {
    await nuxtDevReady(port);
    await page.goto(`http://localhost:${port}`);

    await expect(page.locator('link[rel=canonical]')).toHaveAttribute(
      'href',
      `http://localhost:${port}/en`,
    );

    await expect(page.locator('a')).toHaveAttribute('href', '/en/foo');
  } finally {
    await kill(nuxt.pid);
  }
});

test('page title', async ({ page }, testInfo) => {
  const cwd = testInfo.outputPath();

  await outputFiles(cwd, {
    'config.ts': endent`
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
  const port = await getPort();
  const nuxt = base.run('dev', { env: { PORT: port } });

  try {
    await nuxtDevReady(port);
    await page.goto(`http://localhost:${port}`);
    await expect(page).toHaveTitle('Test-App: This is the ultimate app!');
  } finally {
    await kill(nuxt.pid);
  }
});

test('ogImage', async ({ page }, testInfo) => {
  const cwd = testInfo.outputPath();

  await outputFiles(cwd, {
    'config.ts': endent`
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
  const port = await getPort();
  const nuxt = base.run('dev', { env: { PORT: port } });

  try {
    await nuxtDevReady(port);
    await page.goto(`http://localhost:${port}`);
    const meta = page.locator(String.raw`meta[name=og\:image]`);
    await expect(meta).toBeAttached();

    expect(
      await meta.evaluate(meta => (meta as HTMLMetaElement).content),
    ).toEqual('https://example.com/og-image');
  } finally {
    await kill(nuxt.pid);
  }
});

test('port', async ({ page }, testInfo) => {
  const cwd = testInfo.outputPath();
  const port = await getPort();

  await outputFiles(cwd, {
    '.env.schema.json': JSON.stringify({ port: { type: 'integer' } }),
    '.test.env.json': JSON.stringify({ port }),
    'pages/index.vue': endent`
      <template>
        <div class="foo" />
      </template>
    `,
  });

  const base = new Base(config, { cwd });
  await base.prepare();
  const nuxt = base.run('dev');

  try {
    await nuxtDevReady(port);
    await page.goto(`http://localhost:${port}`);
    await expect(page.locator('.foo')).toBeAttached();
  } finally {
    await kill(nuxt.pid);
  }
});

test('request body', async ({ page }, testInfo) => {
  const cwd = testInfo.outputPath();

  await outputFiles(cwd, {
    'package.json': JSON.stringify({ peerDependencies: { h3: '*' } }),
    'pages/index.vue': endent`
      <template>
        <form method="POST" :class="{ sent }">
          <button class="submit-button" name="submit" type="submit">Send</button>
        </form>
      </template>

      <script setup lang="ts">
      import { getMethod, readBody } from 'h3';

      const event = useRequestEvent();

      const sent = await (async () => {
        if (!event || getMethod(event) !== 'POST') {
          return false;
        }
        const { submit } = await readBody(event);
        return submit !== undefined;
      })();
      </script>
    `,
  });

  const base = new Base(config, { cwd });
  await base.prepare();
  const port = await getPort();
  const nuxt = base.run('dev', { env: { PORT: port } });

  try {
    await nuxtDevReady(port);
    await page.goto(`http://localhost:${port}`);
    await page.locator('.submit-button').click();
    await expect(page.locator('form')).toContainClass('sent');
  } finally {
    await kill(nuxt.pid);
  }
});

test('router config', async ({ page }, testInfo) => {
  const cwd = testInfo.outputPath();

  await outputFiles(cwd, {
    'config.ts': endent`
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
  const port = await getPort();
  const nuxt = base.run('dev', { env: { PORT: port } });

  try {
    await nuxtDevReady(port);
    await page.goto(`http://localhost:${port}`);
    await expect(page.locator('.foo.is-active')).toBeAttached();
  } finally {
    await kill(nuxt.pid);
  }
});

test('scoped style in production', async ({ page }, testInfo) => {
  const cwd = testInfo.outputPath();

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
  const port = await getPort();
  await base.run('prepublishOnly');
  const nuxt = base.run('start', { env: { PORT: port } });

  try {
    await portReady(port);
    await page.goto(`http://localhost:${port}`);

    expect(
      await page
        .locator('.foo')
        .evaluate(el => getComputedStyle(el).backgroundColor),
    ).toEqual('rgb(255, 0, 0)');
  } finally {
    await kill(nuxt.pid);
  }
});

test('sitemap', async ({}, testInfo) => {
  const cwd = testInfo.outputPath();

  await outputFiles(cwd, {
    'config.ts': endent`
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
  const port = await getPort();
  const nuxt = base.run('dev', { env: { PORT: port } });

  try {
    await nuxtDevReady(port);

    const { data: sitemap } = await axios.get(
      `http://localhost:${port}/sitemap.xml?canonical`,
    );

    expect(
      xmlFormatter(sitemap, {
        collapseContent: true,
        indentation: '  ',
        lineSeparator: '\n',
      }),
    ).toMatchSnapshot();
  } finally {
    await kill(nuxt.pid);
  }
});

test('svg inline', async ({ page }, testInfo) => {
  const cwd = testInfo.outputPath();

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
  const port = await getPort();
  const nuxt = base.run('dev', { env: { PORT: port } });

  try {
    await nuxtDevReady(port);
    await page.goto(`http://localhost:${port}`);
    const icon = page.locator('.icon');
    await expect(icon).toBeAttached();
    expect(await icon.evaluate(el => el.tagName)).toEqual('svg');
  } finally {
    await kill(nuxt.pid);
  }
});

test('svg url', async ({ page }, testInfo) => {
  const cwd = testInfo.outputPath();

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
  const port = await getPort();
  const nuxt = base.run('dev', { env: { PORT: port } });

  try {
    await nuxtDevReady(port);
    await page.goto(`http://localhost:${port}`);
    const image = page.locator('.image');
    await expect(image).toBeAttached();
    expect(await image.evaluate(el => el.tagName)).toEqual('IMG');

    await expect(image).toHaveAttribute(
      'src',
      "data:image/svg+xml,%3csvg%20xmlns='http://www.w3.org/2000/svg'%20/%3e",
    );
  } finally {
    await kill(nuxt.pid);
  }
});

test('userScalable', async ({ page }, testInfo) => {
  const cwd = testInfo.outputPath();

  await outputFiles(cwd, {
    'config.ts': endent`
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
  const port = await getPort();
  const nuxt = base.run('dev', { env: { PORT: port } });

  try {
    await nuxtDevReady(port);
    await page.goto(`http://localhost:${port}`);

    await expect(
      page.locator(String.raw`meta[name=viewport][content$=user-scalable\=0]`),
    ).toBeAttached();
  } finally {
    await kill(nuxt.pid);
  }
});

test('valid', async ({ page }, testInfo) => {
  const cwd = testInfo.outputPath();

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
  const port = await getPort();
  const nuxt = base.run('dev', { env: { PORT: port } });

  try {
    await nuxtDevReady(port);
    await page.goto(`http://localhost:${port}`);
    await expect(page.locator('.foo')).toHaveText('Hello world');
  } finally {
    await kill(nuxt.pid);
  }
});

test('tailwind .nuxt folder stylelint', async ({ page }, testInfo) => {
  const cwd = testInfo.outputPath();

  await outputFiles(cwd, {
    'app.vue': endent`
      <template>
        <div class="foo text-gray-500" />
      </template>
    `,
    'config.ts': `export default defineNuxtConfig({ modules: ['${packageName`@nuxtjs/tailwindcss`}'] })`,
  });

  const base = new Base(config, { cwd });
  await base.prepare();
  const port = await getPort();
  const nuxt = base.run('dev', { env: { PORT: port } });

  try {
    await nuxtDevReady(port);
    await page.goto(`http://localhost:${port}`);

    expect(
      await page.locator('.foo').evaluate(el => getComputedStyle(el).color),
    ).toEqual('oklch(0.551 0.027 264.364)');
  } finally {
    await kill(nuxt.pid);
  }
});
