import withLocalTmpDir from 'with-local-tmp-dir'
import outputFiles from 'output-files'
import execa from 'execa'
import { endent } from '@dword-design/functions'

export default {
  'linting error': () =>
    withLocalTmpDir(async () => {
      await outputFiles({
        'package.json': JSON.stringify(
          {
            baseConfig: require.resolve('.'),
          },
          undefined,
          2
        ),
        src: {
          'model/foo.js': 'const foo = 1',
          'pages/index.js': endent`
            import foo from '@/model/foo'

            export default {
              render: () => <div>{ foo }</div>,
            };
          `,
        },
      })
      await execa.command('base prepare')
      let all
      try {
        await execa.command('base test', { all: true })
      } catch (error) {
        all = error.all
      }
      expect(all).toMatch("foo' is assigned a value but never used")
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
        'src/pages/index.js': endent`
          export default {
            render: () => <div>Hello world</div>,
          }
          
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
        src: {
          'model/foo.js': "export default 'bar'",
          'pages/index.js': endent`
            import foo from '@/model/foo'

            export default {
              render: () => <div>{ foo }</div>,
            }

          `,
        },
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
        'src/index.js': endent`
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

      await execa.command('base prepare')
      await execa.command('base test')
    }),
}
