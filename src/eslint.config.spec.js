import { endent, mapValues } from '@dword-design/functions'
import execa from 'execa'
import withLocalTmpDir from 'with-local-tmp-dir'
import outputFiles from 'output-files'

const runTest = ({ files, match = '' }) => () =>
  withLocalTmpDir(async () => {
    await outputFiles({
      ...files,
      '.eslintrc.json': JSON.stringify(
        {
          extends: require.resolve('./eslint.config'),
        },
        undefined,
        2
      ),
    })
    try {
      const { all } = await execa('eslint', ['--ext', '.js,.json,.vue', '.'], {
        all: true,
      })
      expect(all).toBeFalsy()
    } catch (error) {
      if (match) {
        expect(error.all).toMatch(match)
      } else {
        throw error
      }
    }
  })

export default {
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
} |> mapValues(runTest)
