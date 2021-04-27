import { endent } from '@dword-design/functions'
import tester from '@dword-design/tester'
import testerPluginTmpDir from '@dword-design/tester-plugin-tmp-dir'
import execa from 'execa'
import outputFiles from 'output-files'

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
          await outputFiles({
            ...test.files,
            'node_modules/base-config-self/index.js':
              "module.exports = require('../../../src')",
            'package.json': JSON.stringify(
              {
                baseConfig: 'self',
              },
              undefined,
              2
            ),
          })
          try {
            await execa.command('base prepare')

            const output = await execa(
              'eslint',
              ['--ext', '.js,.json,.vue', '.'],
              {
                all: true,
              }
            )
            expect(output.all).toBeFalsy()
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
