import { Base } from '@dword-design/base';
import { endent } from '@dword-design/functions';
import { expect } from '@playwright/test';
import nuxtDevReady from 'nuxt-dev-ready';
import outputFiles from 'output-files';
import { test } from 'playwright-local-tmp-dir';
import kill from 'tree-kill-promise';

test('aliases', async ({ page }) => {
  test.setTimeout(60_000);
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
    await page.goto('http://localhost:3000');
    const foo = page.locator('.foo');
    await expect(foo).toBeAttached();
    expect(await foo.evaluate(div => div.textContent)).toEqual('Hello world');
  } finally {
    await kill(childProcess.pid);
    await new Promise(resolve => setTimeout(resolve, 10_000));
  }
});
