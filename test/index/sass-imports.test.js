import withLocalTmpDir from 'with-local-tmp-dir'
import outputFiles from 'output-files'
import { endent } from '@dword-design/functions'
import { Nuxt, Builder } from 'nuxt'
import stealthyRequire from 'stealthy-require'

export default () => withLocalTmpDir(__dirname, async () => {
  await outputFiles({
    'node_modules/sass-foo': {
      'package.json': endent`
        {
          "main": "index.scss"
        }
      `,
      'index.scss': endent`
        body {
          background: red;
        }
      `,
    },
    'package.json': endent`
      {
        "baseConfig": "nuxt",
        "dependencies": {
          "sass-foo": "^1.0.0"
        },
        "devDependencies": {
          "@dword-design/base-config-nuxt": "^1.0.0"
        }
      }

    `,
    src: {
      'assets/style.scss': '@import \'~sass-foo\'',
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

  const nuxtConfig = stealthyRequire(require.cache, () => require('../../src/nuxt.config'))
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
