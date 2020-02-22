import withLocalTmpDir from 'with-local-tmp-dir'
import outputFiles from 'output-files'
import { endent } from '@dword-design/functions'
import { Nuxt, Builder } from 'nuxt'
import stealthyRequire from 'stealthy-require'
import P from 'path'

export default {
  'sass imports': () => withLocalTmpDir(async () => {
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

    const { nuxtConfig } = stealthyRequire(require.cache, () => require('.'))
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
  }),
  sass: () => withLocalTmpDir(async () => {
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

    const { nuxtConfig } = stealthyRequire(require.cache, () => require('.'))
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
  }),
  valid: () => withLocalTmpDir(__dirname, async () => {
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

    const { nuxtConfig, nuxtConfigFilename } = stealthyRequire(require.cache, () => require('.'))
    expect(nuxtConfigFilename).toEqual(P.resolve(__dirname, '..', 'src', 'nuxt.config.js'))
    const nuxt = new Nuxt({ ...nuxtConfig, dev: false })
    await new Builder(nuxt).build()
    try {
      await nuxt.server.listen()
      const { html } = await nuxt.server.renderRoute('/')
      expect(html).toMatch('<div>Hello world</div>')
    } finally {
      nuxt.close()
    }
  }),
}
