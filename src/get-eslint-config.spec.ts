import { Base } from '@dword-design/base';
import { expect, test } from '@playwright/test';
import endent from 'endent';
import { execaCommand } from 'execa';
import outputFiles from 'output-files';

const tests = {
  'loader import syntax': {
    files: {
      app: {
        'assets/hero.svg': '',
        'pages/index.vue': endent`
          <template>
            <div />
          </template>

          <script setup lang="ts">
          import '@/assets/hero.svg?url';
          </script>\n
        `,
      },
    },
  },
  'page and filename with camelCase': {
    filename: 'app/pages/[paramId].vue',
    files: {
      'app/pages/[paramId].vue': endent`
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
};

for (const [name, _testConfig] of Object.entries(tests)) {
  const testConfig = {
    config: {},
    error: '',
    filename: 'app/pages/index.vue',
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
          execaCommand(`eslint ${testConfig.filename}`, {
            cwd,
            stdio: 'inherit',
          }),
        ).rejects.toThrow(testConfig.error)
      : execaCommand(`eslint ${testConfig.filename}`, {
          cwd,
          stdio: 'inherit',
        }));
  });
}
