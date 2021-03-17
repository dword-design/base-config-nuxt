import { endent, mapValues } from '@dword-design/functions'
import execa from 'execa'
import outputFiles from 'output-files'
import withLocalTmpDir from 'with-local-tmp-dir'

const runTest = config => () =>
  withLocalTmpDir(async () => {
    await outputFiles({
      '.babelrc.json': JSON.stringify(
        {
          extends: '@dword-design/babel-config',
        },
        undefined,
        2
      ),
      'depcheck.config.js': endent`
        const special = require('../src/depcheck-special')
        module.exports = {
          specials: [
            special,
          ],
        }
      `,
      ...config.files,
    })
    try {
      await execa.command('depcheck --config depcheck.config.js')
    } catch (error) {
      expect(error.message).toMatch('Unused dependencies')
      expect(config.fail).toBeTruthy()
    }
  })

export default {
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
  'babel feature': {
    files: {
      'nuxt.config.js': endent`
        export default {
          modules: ['foo'],
          foo: 1 |> x => x * 2,
        }
      `,
      'package.json': JSON.stringify({
        dependencies: {
          foo: '^1.0.0',
        },
      }),
    },
  },
  buildModules: {
    files: {
      'nuxt.config.js': endent`
        export default {
          buildModules: [
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
  function: {
    files: {
      'nuxt.config.js': endent`
        export default {
          modules: [
            'foo',
            () => {},
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
  modules: {
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
  'unused dependency': {
    fail: true,
    files: {
      'package.json': JSON.stringify({
        dependencies: {
          foo: '^1.0.0',
        },
      }),
    },
  },
} |> mapValues(runTest)
