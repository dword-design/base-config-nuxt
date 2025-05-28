import { Base } from '@dword-design/base';
import { endent } from '@dword-design/functions';
import { expect } from '@playwright/test';
import { execaCommand } from 'execa';
import outputFiles from 'output-files';
import { test } from 'playwright-local-tmp-dir';

const tests = {
  definePageMeta: {
    filename: 'pages/index.vue',
    files: {
      'pages/index.vue': endent`
        <script setup>
        definePageMeta({ foo: 'bar' });
        </script>

      `,
    },
  },
  'definePageMeta in other pages folder': {
    error: "error  'definePageMeta' is not defined  no-undef",
    filename: 'foo/pages/index.vue',
    files: {
      'foo/pages/index.vue': endent`
        <script setup>
        definePageMeta({ foo: 'bar' });
        </script>

      `,
    },
  },
  'definePageMeta outside page': {
    error: "error  'definePageMeta' is not defined  no-undef",
    filename: 'plugins/foo.js',
    files: {
      'plugins/foo.js': endent`
        definePageMeta({ foo: 'bar' });

      `,
    },
  },
  'file extension: alias: existing': {
    filename: 'server/api/foo.js',
    files: {
      'model/foo.js': '',
      'server/api/foo.js': "import '@/model/foo.js';\n",
    },
  },
  'file extension: alias: missing': {
    error:
      '1:8  error  Missing file extension "js" for "@/model/foo"  import/extensions',
    filename: 'server/api/foo.js',
    files: {
      'model/foo.js': '',
      'server/api/foo.js': "import '@/model/foo';\n",
    },
  },
  'loader import syntax': {
    files: {
      'assets/hero.svg': '',
      'pages/index.vue': endent`
        <template>
          <div />
        </template>

        <script setup>
        import '@/assets/hero.svg?url';
        </script>

      `,
    },
  },
};

for (const [name, _testConfig] of Object.entries(tests)) {
  const testConfig = { error: '', filename: 'pages/index.vue', ..._testConfig };

  test(name, async () => {
    await outputFiles(testConfig.files);
    await new Base({ name: '../src/index.js', ...testConfig.config }).prepare();
    await execaCommand('nuxi prepare');

    await (testConfig.error
      ? expect(execaCommand(`eslint ${testConfig.filename}`)).rejects.toThrow(
          testConfig.error,
        )
      : execaCommand(`eslint ${testConfig.filename}`));
  });
}
