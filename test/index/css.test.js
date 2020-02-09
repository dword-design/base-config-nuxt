import withLocalTmpDir from 'with-local-tmp-dir'
import outputFiles from 'output-files'
import { endent } from '@dword-design/functions'
import { readFile } from 'fs-extra'
import { Nuxt, Builder } from 'nuxt'
import stealthyRequire from 'stealthy-require'

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
        render: () => <div class="C(red)">Hello world</div>,
      }
    `,
  })

  const nuxtConfig = stealthyRequire(require.cache, () => require('../../src/nuxt.config'))
  const nuxt = new Nuxt({ ...nuxtConfig, dev: false })
  await new Builder(nuxt).build()
  try {
    await nuxt.server.listen()
    const { html } = await nuxt.server.renderRoute('/')
    expect(html).toMatch('"/acss.css"')
    expect(await readFile('dist/acss.css', 'utf8')).toEqual('.C\\(red\\){color:red}')
  } finally {
    nuxt.close()
  }
})
