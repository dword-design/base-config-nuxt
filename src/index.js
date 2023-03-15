import depcheckParserSass from '@dword-design/depcheck-parser-sass'
import { endent } from '@dword-design/functions'
import packageName from 'depcheck-package-name'
import depcheckParserVue from 'depcheck-parser-vue'
import { createRequire } from 'module'
import outputFiles from 'output-files'
import P from 'path'

import analyze from './analyze.js'
import depcheckSpecial from './depcheck-special.js'
import dev from './dev.js'
import lint from './lint.js'
import prepublishOnly from './prepublish-only.js'
import start from './start.js'

const _require = createRequire(import.meta.url)

export default {
  allowedMatches: [
    '.stylelintrc.json',
    'api',
    'assets',
    'components',
    'content',
    'i18n',
    'layouts',
    'middleware',
    'model',
    'modules',
    'config.js',
    'pages',
    'plugins',
    'static',
    'store',
    'types',
  ],
  commands: {
    analyze,
    dev,
    prepublishOnly,
    start,
  },
  depcheckConfig: {
    parsers: {
      '**/*.scss': depcheckParserSass,
      '**/*.vue': depcheckParserVue,
    },
    specials: [depcheckSpecial],
  },
  editorIgnore: [
    '.eslintcache',
    '.stylelintrc.json',
    '.nuxt',
    'app.vue',
    'dist',
    'nuxt.config.js',
  ],
  gitignore: [
    '/.eslintcache',
    '/.nuxt',
    '/app.vue',
    '/dist',
    '/nuxt.config.js',
  ],
  lint,
  npmPublish: true,
  packageConfig: {
    main: 'dist/index.js',
  },
  prepare: () => {
    const projectModulePath = `./${P.relative(
      process.cwd(),
      _require.resolve('./modules/project/index.js'),
    )
      .split(P.sep)
      .join('/')}`

    return outputFiles({
      '.stylelintrc.json': JSON.stringify(
        {
          extends: packageName`@dword-design/stylelint-config`,
        },
        undefined,
        2,
      ),
      'app.vue': endent`
        <template>
          <NuxtLayout>
            <NuxtPage />
          </NuxtLayout>
        </template>

        <script setup>
        const i18nHead = typeof useLocaleHead === 'function' ? useLocaleHead({ addSeoAttributes: true }) : undefined
        const runtimeConfig = useRuntimeConfig()

        useHead({
          ...i18nHead !== undefined && {
            htmlAttrs: {
              lang: i18nHead.value.htmlAttrs.lang,
            },
            link: i18nHead.value.link,
            meta: i18nHead.value.meta,
          },
          titleTemplate: title => title ? \`\${title} | \$\{runtimeConfig.name}\` : \`\${runtimeConfig.name}\${runtimeConfig.title ? \`: \${runtimeConfig.title}\` : ''}\`,
        })
        </script>
      `,
      'nuxt.config.js': endent`
        import projectModule from '${projectModulePath}'
        import jiti from 'jiti'
        import babelConfig from '@dword-design/babel-config'
        import dotenv from '@dword-design/dotenv-json-extended'

        dotenv.config()

        let options
        try {
          const jitiInstance = jiti(process.cwd(), {
            esmResolve: true,
            interopDefault: true,
            transformOptions: {
              babel: babelConfig,
            },
          })
          options = jitiInstance('./config.js')
        } catch (error) {
          if (error.message.startsWith("Cannot find module './config.js'\\n")) {
            options = {}
          } else {
            throw error
          }
        }

        export default {
          modules: [
            [projectModule, options],
          ],
        }
      `,
    })
  },
  useJobMatrix: true,
}
