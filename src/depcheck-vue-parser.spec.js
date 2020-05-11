import withLocalTmpDir from 'with-local-tmp-dir'
import outputFiles from 'output-files'
import { endent } from '@dword-design/functions'
import execa from 'execa'

export default {
  valid: () =>
    withLocalTmpDir(async () => {
      await outputFiles({
        'depcheck.config.js': endent`
          const parser = require('../src/depcheck-vue-parser')
          module.exports = {
            parser: {
              '*.vue': parser,
            },
          }
        `,
        'package.json': JSON.stringify(
          {
            dependencies: {
              foo: '^1.0.0',
            },
          },
          undefined,
          2
        ),
        'src/pages/index.vue': endent`
          <script>
          import foo from 'foo'

          export default {
            computed: {
              foo: () => 1 |> (x => x * 2),
            },
          }
          </script>

        `,
      })
      await execa.command('depcheck --config depcheck.config.js')
    }),
  'unused dependency': () =>
    withLocalTmpDir(async () => {
      await outputFiles({
        'depcheck.config.js': endent`
        const parser = require('../src/depcheck-vue-parser')
        module.exports = {
          parser: {
            '*.vue': parser,
          },
        }
      `,
        'package.json': JSON.stringify(
          {
            dependencies: {
              foo: '^1.0.0',
            },
          },
          undefined,
          2
        ),
      })
      await expect(
        execa.command('depcheck --config depcheck.config.js')
      ).rejects.toThrow('Unused dependencies')
    }),
}
