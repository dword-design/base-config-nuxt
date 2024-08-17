import { Base } from '@dword-design/base';
import { endent } from '@dword-design/functions';
import tester from '@dword-design/tester';
import testerPluginTmpDir from '@dword-design/tester-plugin-tmp-dir';
import { execaCommand } from 'execa';
import outputFiles from 'output-files';

export default tester(
  {
    '#components import': {
      filename: 'pages/index.vue',
      files: {
        'pages/index.vue': endent`
          <template>
            <component :is="NuxtLink" />
          </template>

          <script setup>
          import { NuxtLink } from '#components';
          </script>

        `,
      },
    },
    '#imports import': {
      filename: 'plugins/foo.js',
      files: {
        'assets/hero.svg': '',
        'plugins/foo.js': endent`
          import { defineNuxtPlugin } from '#imports';

          export default defineNuxtPlugin(() => {});

        `,
      },
    },
    'custom import': {
      config: { importAliases: ['#foo'] },
      filename: 'pages/index.vue',
      files: {
        'pages/index.vue': endent`
          <template>
            <div>{{ foo }}</div>
          </template>

          <script setup>
          import { foo } from '#foo';
          </script>

        `,
      },
    },
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
  },
  [
    {
      transform: test => {
        test = { error: '', filename: 'pages/index.vue', ...test };

        return async () => {
          await outputFiles(test.files);
          await new Base({ name: '../src/index.js', ...test.config }).prepare();

          if (test.error) {
            await expect(
              execaCommand(`eslint ${test.filename}`),
            ).rejects.toThrow(test.error);
          } else {
            await execaCommand(`eslint ${test.filename}`);
          }
        };
      },
    },
    testerPluginTmpDir(),
  ],
);
