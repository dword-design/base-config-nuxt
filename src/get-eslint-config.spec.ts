import { Base } from '@dword-design/base';
import { expect, test } from '@playwright/test';
import endent from 'endent';
import { execaCommand } from 'execa';
import outputFiles from 'output-files';

const tests = {
  definePageMeta: {
    filename: 'pages/index.vue',
    files: {
      'pages/index.vue': endent`
        <script setup>
        definePageMeta({ foo: 'bar' });
        </script>\n
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
        </script>\n
      `,
    },
  },
  'definePageMeta outside page': {
    error: "error  'definePageMeta' is not defined  no-undef",
    filename: 'plugins/foo.ts',
    files: { 'plugins/foo.ts': "definePageMeta({ foo: 'bar' });\n" },
  },
  'file extension: alias: existing': {
    filename: 'server/api/foo.ts',
    files: {
      'model/foo.ts': '',
      'server/api/foo.ts': "import '@/model/foo.ts';\n",
    },
  },
  'file extension: alias: missing': {
    error:
      '1:8  error  Missing file extension "js" for "@/model/foo"  import/extensions',
    filename: 'server/api/foo.ts',
    files: {
      'model/foo.ts': '',
      'server/api/foo.ts': "import '@/model/foo';\n",
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
        </script>\n
      `,
    },
  },
  'page and filename with camelCase': {
    filename: 'pages/[paramId].vue',
    files: {
      'pages/[paramId].vue': endent`
        <template>
          <div />
        </template>\n
      `,
    },
  },
  'server api filename with camelCase': {
    filename: 'server/api/[paramId].get.ts',
    files: {
      'server/api/[paramId].get.ts':
        "export default defineEventHandler(() => '');\n",
    },
  },
  'virtual import': {
    config: { virtualImports: ['#auth'] },
    filename: 'pages/index.vue',
    files: {
      'pages/index.vue': endent`
        <script setup>
        import '#auth';
        </script>\n
      `,
    },
  },
};

for (const [name, _testConfig] of Object.entries(tests)) {
  const testConfig = {
    config: {},
    error: '',
    filename: 'pages/index.vue',
    ..._testConfig,
  };

  test(name, async ({}, testInfo) => {
    const cwd = testInfo.outputPath();
    await outputFiles(cwd, testConfig.files);

    const base = new Base(
      { name: '../../src/index.ts', ...testConfig.config },
      { cwd },
    );

    await base.prepare();
    await execaCommand('nuxi prepare', { cwd });

    await (testConfig.error
      ? expect(
          execaCommand(`eslint ${testConfig.filename}`, { cwd }),
        ).rejects.toThrow(testConfig.error)
      : execaCommand(`eslint ${testConfig.filename}`, { cwd }));
  });
}
