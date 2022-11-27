import { Base } from '@dword-design/base'
import { endent } from '@dword-design/functions'
import tester from '@dword-design/tester'
import testerPluginTmpDir from '@dword-design/tester-plugin-tmp-dir'
import outputFiles from 'output-files'

import config from './index.js'

export default tester(
  {
    aliases: async () => {
      await outputFiles({
        'model/foo.js': "export default 'bar'",
        'pages/index.vue': endent`
        <template>
          <div />
        </template>

        <script>
        import foo from '@/model/foo'

        export default {
          computed: {
            foo: () => foo,
          },
        }
        </script>

      `,
      })

      const base = new Base(config)
      await base.prepare()
      await base.test()
    },
    'dependency inside vue file': async () => {
      await outputFiles({
        'node_modules/foo/index.js': '',
        'package.json': JSON.stringify(
          {
            baseConfig: 'self',
            dependencies: {
              foo: '^1.0.0',
            },
          },
          undefined,
          2
        ),
        'pages/index.vue': endent`
        <template>
          <div />
        </template>

        <script>
        import foo from 'foo'

        export default {
          computed: {
            foo: () => foo,
            bar: () => 1 |> (x => x * 2),
          },
        }
        </script>

      `,
      })

      const base = new Base(config)
      await base.prepare()
      await base.test()
    },
    'external modules': async () => {
      await outputFiles({
        'nuxt.config.js': endent`
        export default {
          modules: [
            'foo',
          ],
        }

      `,
        'package.json': JSON.stringify(
          {
            dependencies: {
              foo: '^1.0.0',
            },
            type: 'module',
          },
          undefined,
          2
        ),
      })

      const base = new Base(config)
      await base.prepare()
      await base.test()
    },
    jsx: async () => {
      await outputFiles({
        'package.json': JSON.stringify(
          {
            baseConfig: 'self',
          },
          undefined,
          2
        ),
        'pages/index.vue': endent`
        <script>
        export default {
          render: () => <div />,
        }
        </script>

      `,
      })

      const base = new Base(config)
      await base.prepare()
      await base.test()
    },
    'linting error in js file': async () => {
      await outputFiles({
        'model/foo.js': 'const foo = 1',
        'package.json': JSON.stringify(
          {
            baseConfig: 'self',
          },
          undefined,
          2
        ),
        'pages/index.vue': endent`
        <script>
        import foo from '@/model/foo'

        export default {
          computed: {
            foo: () => foo,
          },
        }
        </script>

      `,
      })

      const base = new Base(config)
      await base.prepare()
      await expect(base.test()).rejects.toThrow(
        "'foo' is assigned a value but never used"
      )
    },
    'linting error in vue file': async () => {
      await outputFiles({
        'node_modules/base-config-self/index.js':
          "module.exports = require('../../../src')",
        'package.json': JSON.stringify(
          {
            baseConfig: 'self',
          },
          undefined,
          2
        ),
        'pages/index.vue': endent`
        <script>
        foo bar
        </script>

      `,
      })

      const base = new Base(config)
      await base.prepare()
      await expect(base.test()).rejects.toThrow(
        'Parsing error: Missing semicolon. (2:3)'
      )
    },
    valid: async () => {
      await outputFiles({
        'package.json': JSON.stringify(
          {
            baseConfig: 'self',
          },
          undefined,
          2
        ),
        'pages/index.vue': endent`
        <template>
          <div>Hello world</div>
        </template>

      `,
      })

      const base = new Base(config)
      await base.prepare()
      await base.test()
    },
  },
  [testerPluginTmpDir()]
)
