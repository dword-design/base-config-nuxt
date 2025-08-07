import { Base } from '@dword-design/base';
import { expect, test } from '@playwright/test';
import endent from 'endent';
import { execaCommand } from 'execa';
import outputFiles from 'output-files';

const tests = {
  'file extension: alias: existing': {
    error:
      '1:8  error  Unexpected use of file extension "ts" for "@/model/foo.ts"  import-x/extension',
    filename: 'server/api/foo.ts',
    files: {
      'model/foo.ts': '',
      'server/api/foo.ts': "import '@/model/foo.ts';\n",
    },
  },
  'file extension: alias: missing': {
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
    const base = new Base({ name: '../../src', ...testConfig.config }, { cwd });
    await base.prepare();
    await execaCommand('nuxi prepare', { cwd });

    await (testConfig.error
      ? expect(
          execaCommand(`eslint ${testConfig.filename}`, { cwd }),
        ).rejects.toThrow(testConfig.error)
      : execaCommand(`eslint ${testConfig.filename}`, { cwd }));
  });
}
