import withLocalTmpDir from 'with-local-tmp-dir'
import outputFiles from 'output-files'
import { endent } from '@dword-design/functions'
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
      'assets/style.scss': endent`
        body {
          background: red;
        }
      `,
      'index.js': endent`
        export default {
          css: [
            '~/assets/style.scss',
          ],
        }
      `,
      'pages/index.js': endent`
        export default {
          render: () => <div>Hello world</div>,
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
    expect(html).toMatch('body{background:red}')
    expect(html).toMatch('<div>Hello world</div>')
  } finally {
    await nuxt.close()
  }
})
