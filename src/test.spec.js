import withLocalTmpDir from 'with-local-tmp-dir'
import outputFiles from 'output-files'
import execa from 'execa'
import { endent } from '@dword-design/functions'

export default {
  'linting error': () => withLocalTmpDir(async () => {
    await outputFiles({
      'package.json': endent`
        {
          "baseConfig": "nuxt",
          "devDependencies": {
            "@dword-design/base-config-nuxt": "^1.0.0"
          }
        }

      `,
      'src/pages/index.js': endent`
        export default {
          render: () => <div>Hello world</div>,
        };
      `,
    })
    await execa.command('base prepare')
    let all
    try {
      await execa.command('base test', { all: true })
    } catch (error) {
      all = error.all
    }
    expect(all).toMatch('error  Extra semicolon  semi')
  }),
  'self import': () => withLocalTmpDir(async () => {
    await outputFiles({
      inner: {
        'package.json': endent`
          {
            "baseConfig": "nuxt",
            "devDependencies": {
              "@dword-design/functions": "^1.0.0",
              "axios": "^1.0.0",
              "execa": "^1.0.0",
              "port-ready": "^1.0.0",
              "tree-kill-promise": "^1.0.0"
            }
          }

        `,
        'src/pages/index.js': endent`
          import foo from 'foo'

          export default {
            render: () => <div>{ foo }</div>,
          }
        `,
        'test/valid.test.js': endent`
          import axios from 'axios'
          import execa from 'execa'
          import portReady from 'port-ready'
          import { property } from '@dword-design/functions'
          import kill from 'tree-kill-promise'

          export default async () => {
            await execa.command('base prepare')
            await execa.command('base prepublishOnly')
            const childProcess = execa.command('base start')
            await portReady(3000)
            const html = axios.get('http://localhost:3000') |> await |> property('data')
            expect(html).toMatch('<div>Hello world</div>')
            await kill(childProcess)
          }
        `,
      },
      'package.json': endent`
        {
          "name": "foo",
          "main": "src/index.js"
        }

      `,
      'src/index.js': 'export default \'Hello world\'',
    })

    process.chdir('inner')
    await execa.command('base prepare')
    await execa.command('base test')
  }),
  valid: () => withLocalTmpDir(async () => {
    await outputFiles({
      'package.json': endent`
        {
          "baseConfig": "nuxt",
          "devDependencies": {
            "@dword-design/base-config-nuxt": "^1.0.0"
          }
        }

      `,
      'src/pages/index.js': endent`
        export default {
          render: () => <div>Hello world</div>,
        }
      `,
    })

    await execa.command('base prepare')
    await execa.command('base test')
  }),
}
