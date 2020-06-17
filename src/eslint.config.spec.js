import { endent, mapValues } from '@dword-design/functions'
import execa from 'execa'
import outputFiles from 'output-files'
import withLocalTmpDir from 'with-local-tmp-dir'

const runTest = config => () => {
  const match = config.match || ''
  return withLocalTmpDir(async () => {
    await outputFiles({
      ...config.files,
      '.eslintrc.json': JSON.stringify(
        {
          extends: require.resolve('./eslint.config'),
        },
        undefined,
        2
      ),
    })
    try {
      const output = await execa('eslint', ['--ext', '.js,.json,.vue', '.'], {
        all: true,
      })
      expect(output.all).toBeFalsy()
    } catch (error) {
      if (match) {
        expect(error.all).toMatch(match)
      } else {
        throw error
      }
    }
  })
}

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
