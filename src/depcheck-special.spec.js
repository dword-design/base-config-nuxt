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
        'config.js': endent`
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
        'config.js': endent`
          export default {
            modules: ['foo'],
            foo: 1 |> x => x * 2,
          }
        `,
      },
    },
    buildModules: {
      files: {
        'config.js': endent`
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
        'config.js': endent`
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
        'config.js': endent`
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
        await outputFiles({
          '.babelrc.json': JSON.stringify({
            extends: '@dword-design/babel-config',
          }),
          ...config.files,
        })

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
