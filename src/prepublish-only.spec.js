import withLocalTmpDir from 'with-local-tmp-dir'
import outputFiles from 'output-files'
import { endent } from '@dword-design/functions'
import execa from 'execa'
import { readFile, chmod } from 'fs-extra'
import P from 'path'

export default {
  'fixable linting error': () =>
    withLocalTmpDir(async () => {
      await outputFiles({
        'package.json': endent`
        {
          "baseConfig": "${require.resolve('.')}",
        }

      `,
        src: {
          'model/index.js': endent`
          export default 1;

        `,
          'pages/index.js': endent`
          import model '@/model'

          export default {
            render: () => <div>{ model }</model>,
          }
        `,
        },
      })
      await execa.command('base prepare')
      await execa.command('base prepublishOnly')
      expect(await readFile(P.join('src', 'model', 'index.js'), 'utf8'))
        .toEqual(endent`
      export default 1
      
    `)
    }),
  'console output': () =>
    withLocalTmpDir(async () => {
      await outputFiles({
        'package.json': endent`
        {
          "baseConfig": "nuxt",
          "devDependencies": {
            "@dword-design/base-config-nuxt": "^1.0.0"
          }
        }

      `,
        src: {
          'index.js': endent`
          export default {
            modules: [
              () => console.log('foo bar'),
            ],
          }
        `,
        },
      })
      await execa.command('base prepare')
      const { all } = await execa.command('base prepublishOnly', { all: true })
      expect(all).toMatch('foo bar')
    }),
  cli: () =>
    withLocalTmpDir(async () => {
      await outputFiles({
        'package.json': endent`
        {
          "baseConfig": "nuxt",
          "devDependencies": {
            "@dword-design/base-config-nuxt": "^1.0.0"
          }
        }

      `,
        src: {
          'cli.js': endent`
          #!/usr/bin/env node

          import foo from './foo'

          console.log(foo)
        `,
          'foo.js': "export default 'foo'",
        },
      })
      await execa.command('base prepare')
      await execa.command('base prepublishOnly')
      await chmod(P.join('dist', 'cli.js'), '755')
      const { all } = await execa.command('./dist/cli.js', { all: true })
      expect(all).toEqual('foo')
    }),
  'linting error in cli': () =>
    withLocalTmpDir(async () => {
      await outputFiles({
        'package.json': endent`
        {
          "baseConfig": "nuxt",
          "devDependencies": {
            "@dword-design/base-config-nuxt": "^1.0.0"
          }
        }

      `,
        'src/cli.js': endent`
        #!/usr/bin/env node

        console.log('foo');
      `,
      })

      await execa.command('base prepare')
      let all
      try {
        await execa.command('base prepublishOnly', { all: true })
      } catch (error) {
        all = error.all
      }
      expect(all).toMatch('error  Extra semicolon  semi')
    }),
}
