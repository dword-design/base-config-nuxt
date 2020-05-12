import withLocalTmpDir from 'with-local-tmp-dir'
import outputFiles from 'output-files'
import { endent, mapValues } from '@dword-design/functions'
import execa from 'execa'

const runTest = ({ files, fail }) => () =>
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
      ...files,
    })
    try {
      await execa.command('depcheck --config depcheck.config.js')
    } catch (error) {
      expect(error.message).toMatch('Unused dependencies')
      expect(fail).toBeTruthy()
    }
  })

export default {
  valid: {
    files: {
      'nuxt.config.js': endent`
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
    },
  },
  'array syntax': {
    files: {
      'nuxt.config.js': endent`
        export default {
          modules: [
            ['foo', { bar: 'baz' }],
          ],
        }
      `,
      'package.json': JSON.stringify({
        dependencies: {
          foo: '^1.0.0',
        },
      }),
    },
  },
  'unused dependency': {
    files: {
      'package.json': JSON.stringify({
        dependencies: {
          foo: '^1.0.0',
        },
      }),
    },
    fail: true,
  },
} |> mapValues(runTest)
