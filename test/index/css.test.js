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
    src: {
      'index.js': endent`
        export default {
          cssVariables: {
            grid: 16,
          },
        }
      `,
      'pages/index.js': endent`
        export default {
          render: () => <div class="P(2vr) Fz(1ms) C(red)">Hello world</div>,
        }
      `,
    },
  })

  const { nuxtConfig } = stealthyRequire(require.cache, () => require('@dword-design/base-config-nuxt'))
  const nuxt = new Nuxt({ ...nuxtConfig, dev: false })
  await new Builder(nuxt).build()
  try {
    await nuxt.server.listen()
    const { html } = await nuxt.server.renderRoute('/')
    expect(html).toMatch('"/acss.css"')
    expect(await readFile('dist/nuxt/acss.css', 'utf8')).toEqual('.C\\(red\\){color:red}.Fz\\(1ms\\){font-size:1.61803398875rem}.P\\(2vr\\){padding:2rem}')
  } finally {
    nuxt.close()
  }
})
