import withLocalTmpDir from 'with-local-tmp-dir'
import outputFiles from 'output-files'
import { spawn } from 'child-process-promise'
import { endent } from '@dword-design/functions'
import stealthyRequire from 'stealthy-require'
import { Nuxt, Builder } from 'nuxt'

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

  await spawn('base', ['prepare'])
  await spawn('base', ['prepublishOnly'])
  const nuxtConfig = stealthyRequire(require.cache, () => require('../../src/nuxt.config'))
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
