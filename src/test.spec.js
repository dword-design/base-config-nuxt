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
              "@dword-design/base-config-nuxt": "^1.0.0",
              "nuxt": "^1.0.0",
              "stealthy-require": "^1.0.0"
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
          import { Nuxt, Builder } from 'nuxt'
          import stealthyRequire from 'stealthy-require'

          export default async () => {
            const nuxtConfig = stealthyRequire(require.cache, () => require('../../../../src/nuxt.config'))
            const nuxt = new Nuxt({ ...nuxtConfig, dev: false })
            await new Builder(nuxt).build()
            try {
              await nuxt.server.listen()
              const { html } = await nuxt.server.renderRoute('/')
              expect(html).toMatch('<div>Hello world</div>')
            } finally {
              nuxt.close()
            }
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
