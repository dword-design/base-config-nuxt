import { Base } from '@dword-design/base';
import { endent } from '@dword-design/functions';
import tester from '@dword-design/tester';
import testerPluginTmpDir from '@dword-design/tester-plugin-tmp-dir';
import { execaCommand } from 'execa';
import outputFiles from 'output-files';

export default tester(
  {
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
  },
  [
    {
      transform: test => {
        test = { error: '', filename: 'pages/index.vue', ...test };

        return async () => {
          await outputFiles(test.files);
          await new Base({ name: '../src/index.js', ...test.config }).prepare();
          await execaCommand('nuxi prepare');

          await (test.error
            ? expect(execaCommand(`eslint ${test.filename}`)).rejects.toThrow(
                test.error,
              )
            : execaCommand(`eslint ${test.filename}`));
        };
      },
    },
    testerPluginTmpDir(),
  ],
);
