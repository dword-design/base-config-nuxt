import { Base } from '@dword-design/base'
import { endent } from '@dword-design/functions'
import tester from '@dword-design/tester'
import testerPluginTmpDir from '@dword-design/tester-plugin-tmp-dir'
import { execa } from 'execa'
import outputFiles from 'output-files'

import config from './index.js'

export default tester(
  {
    'webpack loader import syntax': {
      files: {
        'assets/hero.svg': '',
        'pages/index.vue': endent`
        <template>
          <div />
        </template>

        <script>
        import imageUrl from '!url-loader!@/assets/hero.svg'

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
            await execa('eslint', ['--ext', '.js,.json,.vue', '.'])
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
  ]
)
