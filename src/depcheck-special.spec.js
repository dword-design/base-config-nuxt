import withLocalTmpDir from 'with-local-tmp-dir'
import outputFiles from 'output-files'
import { endent } from '@dword-design/functions'
import execa from 'execa'

export default {
  valid: () =>
    withLocalTmpDir(async () => {
      await outputFiles({
        'depcheck.config.js': endent`
        const special = require('../src/depcheck-special')
        module.exports = {
          specials: [
            special,
          ],
        }
      `,
        'src/index.js': endent`
        export default {
          modules: [
            'foo',
          ],
        }
      `,
        'package.json': JSON.stringify({
          dependencies: {
            foo: '^1.0.0',
          },
        }),
      })
      await execa.command('depcheck --config depcheck.config.js')
    }),
  'unused dependency': () =>
    withLocalTmpDir(async () => {
      await outputFiles({
        'depcheck.config.js': endent`
        const special = require('../src/depcheck-special')
        module.exports = {
          specials: [
            special,
          ],
        }
      `,
        'package.json': JSON.stringify({
          dependencies: {
            foo: '^1.0.0',
          },
        }),
      })
      await expect(
        execa.command('depcheck --config depcheck.config.js')
      ).rejects.toThrow('Unused dependencies')
    }),
}
