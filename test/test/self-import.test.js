import withLocalTmpDir from 'with-local-tmp-dir'
import outputFiles from 'output-files'
import { spawn } from 'child-process-promise'
import { endent } from '@dword-design/functions'

export default () => withLocalTmpDir(__dirname, async () => {
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
          const nuxtConfig = stealthyRequire(require.cache, () => require('../../../../../src/nuxt.config'))
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
  await spawn('base', ['prepare'])
  await spawn('base', ['test'])
})
