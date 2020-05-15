import withLocalTmpDir from 'with-local-tmp-dir'
import outputFiles from 'output-files'
import execa from 'execa'
import { endent } from '@dword-design/functions'

export default {
  'linting error in js file': () =>
    withLocalTmpDir(async () => {
      await outputFiles({
        'package.json': JSON.stringify(
          {
            baseConfig: require.resolve('.'),
          },
          undefined,
          2
        ),
        'model/foo.js': 'const foo = 1',
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
      await execa.command('base prepare')
      await expect(execa.command('base test')).rejects.toThrow(
        "'foo' is assigned a value but never used"
      )
    }),
  'linting error in vue file': () =>
    withLocalTmpDir(async () => {
      await outputFiles({
        'package.json': JSON.stringify(
          {
            baseConfig: require.resolve('.'),
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
      await execa.command('base prepare')
      await expect(execa.command('base test')).rejects.toThrow(
        'Unexpected token, expected ";"'
      )
    }),
  valid: () =>
    withLocalTmpDir(async () => {
      await outputFiles({
        'package.json': JSON.stringify(
          {
            baseConfig: require.resolve('.'),
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

      await execa.command('base prepare')
      await execa.command('base test')
    }),
  aliases: () =>
    withLocalTmpDir(async () => {
      await outputFiles({
        'package.json': JSON.stringify(
          {
            baseConfig: require.resolve('.'),
          },
          undefined,
          2
        ),
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

      await execa.command('base prepare')
      await execa.command('base test')
    }),
  'external modules': () =>
    withLocalTmpDir(async () => {
      await outputFiles({
        'package.json': JSON.stringify(
          {
            baseConfig: require.resolve('.'),
            dependencies: {
              foo: '^1.0.0',
            },
          },
          undefined,
          2
        ),
        'nuxt.config.js': endent`
          export default {
            modules: [
              'foo',
            ],
          }

        `,
      })

      await execa.command('base prepare')
      await execa.command('base test')
    }),
  'dependency inside vue file': () =>
    withLocalTmpDir(async () => {
      await outputFiles({
        'node_modules/foo/index.js': '',
        'package.json': JSON.stringify(
          {
            baseConfig: require.resolve('.'),
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

      await execa.command('base prepare')
      await execa.command('base test')
    }),
  jsx: () =>
    withLocalTmpDir(async () => {
      await outputFiles({
        'package.json': JSON.stringify(
          {
            baseConfig: require.resolve('.'),
          },
          undefined,
          2
        ),
        'pages/index.vue': endent`
          <script>
          import foo from 'foo'

          export default {
            render: () => <div />,
          }
          </script>

        `,
      })

      await execa.command('base prepare')
      await expect(execa.command('base test')).rejects.toThrow(
        'Unexpected token'
      )
    }),
}
