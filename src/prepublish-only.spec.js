import { endent } from '@dword-design/functions'
import execa from 'execa'
import { chmod, readFile } from 'fs-extra'
import outputFiles from 'output-files'
import P from 'path'
import withLocalTmpDir from 'with-local-tmp-dir'

export default {
  cli: () =>
    withLocalTmpDir(async () => {
      await outputFiles({
        model: {
          'cli.js': endent`
            #!/usr/bin/env node

            import foo from './foo'

            console.log(foo)
          `,
          'foo.js': "export default 'foo'",
        },
        'node_modules/base-config-self/index.js':
          "module.exports = require('../../../src')",
        'package.json': JSON.stringify(
          {
            baseConfig: 'self',
          },
          undefined,
          2
        ),
      })
      await execa.command('base prepare')
      await execa.command('base prepublishOnly')
      await chmod(P.join('dist', 'cli.js'), '755')
      const output = await execa.command('./dist/cli.js', { all: true })
      expect(output.all).toEqual('foo')
    }),
  'console output': () =>
    withLocalTmpDir(async () => {
      await outputFiles({
        'node_modules/base-config-self/index.js':
          "module.exports = require('../../../src')",
        'nuxt.config.js': endent`
          export default {
            modules: [
              () => console.log('foo bar'),
            ],
          }
        `,
        'package.json': JSON.stringify(
          {
            baseConfig: 'self',
          },
          undefined,
          2
        ),
      })
      await execa.command('base prepare')
      const output = await execa.command('base prepublishOnly', { all: true })
      expect(output.all).toMatch('foo bar')
    }),
  'fixable linting error': () =>
    withLocalTmpDir(async () => {
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
          <template>
            <div />
          </template>
          <script>
          export default {};
          </script>

        `,
      })
      await execa.command('base prepare')
      await execa.command('base prepublishOnly')
      expect(await readFile(P.join('pages', 'index.vue'), 'utf8'))
        .toEqual(endent`
          <template>
            <div />
          </template>
          <script>
          export default {}
          </script>

        `)
    }),
  'linting error in cli': () =>
    withLocalTmpDir(async () => {
      await outputFiles({
        'model/cli.js': endent`
          #!/usr/bin/env node

          const foo = 'bar'

        `,
        'node_modules/base-config-self/index.js':
          "module.exports = require('../../../src')",
        'package.json': JSON.stringify(
          {
            baseConfig: 'self',
          },
          undefined,
          2
        ),
      })
      await execa.command('base prepare')
      let all
      try {
        await execa.command('base prepublishOnly', { all: true })
      } catch (error) {
        all = error.all
      }
      expect(all).toMatch("foo' is assigned a value but never used")
    }),
}
