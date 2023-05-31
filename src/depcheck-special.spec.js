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
    'relative path': {
      fail: true,
      files: {
        'config.js': endent`
          export default {
            modules: [
              './modules/foo.js',
            ],
          }
        `,
      },
    },
    scoped: {
      dependency: '@name/foo',
      files: {
        'config.js': endent`
          export default {
            modules: [
              '@name/foo',
            ],
          }
        `,
      },
    },
    'scoped and subpath': {
      dependency: '@name/foo',
      files: {
        'config.js': endent`
          export default {
            modules: [
              '@name/foo/bar',
            ],
          }
        `,
      },
    },
    subpath: {
      files: {
        'config.js': endent`
          export default {
            modules: [
              'foo/bar',
            ],
          }
        `,
      },
    },
    'unused dependency': { fail: true },
  },
  [
    {
      transform: test => async () => {
        test = { dependency: 'foo', fail: false, ...test }
        await outputFiles(test.files)

        const result = await depcheck('.', {
          package: {
            dependencies: {
              [test.dependency]: '^1.0.0',
            },
          },
          specials: [self],
        })
        expect(result.dependencies.length > 0).toEqual(!!test.fail)
      },
    },
    testerPluginTmpDir(),
  ],
)
