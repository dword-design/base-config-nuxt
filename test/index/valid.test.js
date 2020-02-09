import withLocalTmpDir from 'with-local-tmp-dir'
import outputFiles from 'output-files'
import { endent } from '@dword-design/functions'
import { Nuxt, Builder } from 'nuxt'
import stealthyRequire from 'stealthy-require'
import P from 'path'

export default () => withLocalTmpDir(__dirname, async () => {
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

  const { nuxtConfig, nuxtConfigFilename } = stealthyRequire(require.cache, () => require('@dword-design/base-config-nuxt'))
  expect(nuxtConfigFilename).toEqual(P.resolve(__dirname, '..', '..', 'src', 'nuxt.config.js'))
  const nuxt = new Nuxt({ ...nuxtConfig, dev: false })
  await new Builder(nuxt).build()
  try {
    await nuxt.server.listen()
    const { html } = await nuxt.server.renderRoute('/')
    expect(html).toMatch('<div>Hello world</div>')
  } finally {
    nuxt.close()
  }
})
