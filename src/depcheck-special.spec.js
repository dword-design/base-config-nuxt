import { endent } from '@dword-design/functions'
import tester from '@dword-design/tester'
import testerPluginTmpDir from '@dword-design/tester-plugin-tmp-dir'
import depcheck from 'depcheck'
import outputFiles from 'output-files'

import self from './depcheck-special.js'

export default tester(
  {
    'array syntax': {
      files: {
        'nuxt.config.js': endent`
          export default {
            modules: [
              ['foo', { bar: 'baz' }],
            ],
          }
        `,
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
      },
    },
    'unused dependency': { fail: true },
  },
  [
    {
      transform: config => async () => {
        await outputFiles(config.files)

        const result = await depcheck('.', {
          package: {
            dependencies: {
              foo: '^1.0.0',
            },
          },
          specials: [self],
        })
        expect(result.dependencies.length > 0).toEqual(!!config.fail)
      },
    },
    testerPluginTmpDir(),
  ],
)
