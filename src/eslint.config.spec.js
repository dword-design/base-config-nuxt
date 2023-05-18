import { Base } from '@dword-design/base'
import { endent } from '@dword-design/functions'
import tester from '@dword-design/tester'
import testerPluginTmpDir from '@dword-design/tester-plugin-tmp-dir'
import { execaCommand } from 'execa'
import outputFiles from 'output-files'

import config from './index.js'

export default tester(
  {
    'loader import syntax': {
      files: {
        'assets/hero.svg': '',
        'pages/index.vue': endent`
          <template>
            <div />
          </template>

          <script>
          import imageUrl from '@/assets/hero.svg?url'

          export default {
            computed: {
              imageUrl: () => imageUrl,
            },
          }
          </script>

        `,
      },
    },
  },
  [
    {
      transform: test => {
        test = { match: '', ...test }

        return async () => {
          await outputFiles(test.files)
          try {
            await new Base(config).prepare()
            await execaCommand('eslint pages/index.vue')
          } catch (error) {
            if (test.match) {
              expect(error.all).toMatch(test.match)
            } else {
              throw error
            }
          }
        }
      },
    },
    testerPluginTmpDir(),
  ],
)
