import depcheckParserSass from '@dword-design/depcheck-parser-sass'
import { endent, endent as javascript } from '@dword-design/functions'
import packageName from 'depcheck-package-name'
import depcheckParserVue from 'depcheck-parser-vue'
import { globby } from 'globby'
import { createRequire } from 'module'
import outputFiles from 'output-files'
import P from 'path'

import analyze from './analyze.js'
import depcheckSpecial from './depcheck-special.js'
import dev from './dev.js'
import eslintConfig from './eslint.config.js'
import lint from './lint.js'
import prepublishOnly from './prepublish-only.js'
import start from './start.js'

const _require = createRequire(import.meta.url)

export default {
  allowedMatches: [
    '.stylelintrc.json',
    'server/api/**/*.js',
    'server/middleware/**/*.js',
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
    'public',
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
    '.stylelintcache',
    '.stylelintrc.json',
    '.nuxt',
    '.output',
    'app.vue',
    'dist',
    'nuxt.config.js',
  ],
  eslintConfig,
  gitignore: [
    '/.eslintcache',
    '/.nuxt',
    '/.output',
    '/.stylelintcache',
    '/app.vue',
    '/dist',
    '/nuxt.config.js',
  ],
  lint,
  nodeVersion: 18,
  npmPublish: true,
  packageConfig: {
    main: 'dist/index.js',
  },
  prepare: async () => {
    const projectModulePath = `./${P.relative(
      process.cwd(),
      _require.resolve('./modules/project/index.js'),
    )
      .split(P.sep)
      .join('/')}`

    const translations = await globby('i18n/*.json')

    const hasI18n = translations.length > 0
    await outputFiles({
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
        import { ${[
          'useHead',
          ...(hasI18n ? ['useLocaleHead'] : []),
          'useRuntimeConfig',
        ].join(', ')} } from '#imports'

        ${[
          hasI18n
            ? ['const i18nHead = useLocaleHead({ addSeoAttributes: true })']
            : [],
          'const runtimeConfig = useRuntimeConfig()',
        ].join('\n')}

        useHead({
          ${[
            ...(hasI18n
              ? [
                  endent`
                    htmlAttrs: {
                      lang: i18nHead.value.htmlAttrs.lang,
                    },
                    link: i18nHead.value.link,
                    meta: i18nHead.value.meta,
                  `,
                ]
              : []),
            "titleTemplate: title => title ? `${title} | ${runtimeConfig.public.name}` : `${runtimeConfig.public.name}${runtimeConfig.public.title ? `: ${runtimeConfig.public.title}` : ''}`",
          ].join('\n')}
        })
        </script>
      `,
      'nuxt.config.js': javascript`
        import projectModule from '${projectModulePath}'
        import jiti from 'jiti'
        import dotenv from '@dword-design/dotenv-json-extended'
        import jitiBabelTransform from '@dword-design/jiti-babel-transform'
        import { transform } from '@babel/core'
        import { babel as rollupPluginBabel } from '${packageName`@rollup/plugin-babel`}'
        import { parse } from 'vue/compiler-sfc'
        import vueSfcDescriptorToString from '${packageName`vue-sfc-descriptor-to-string`}'
        import { parseVueRequest } from '@vitejs/plugin-vue'
        import P from 'path'

        dotenv.config()

        let options
        try {
          const jitiInstance = jiti(process.cwd(), {
            esmResolve: true,
            interopDefault: true,
            transform: jitiBabelTransform,
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
          nitro: {
            rollupConfig: {
              plugins: [rollupPluginBabel({ babelHelpers: 'bundled' })],
            },
          },
          modules: [
            [projectModule, options],
          ],
          vite: {
            plugins: [
              {
                enforce: 'pre',
                transform: async (code, id) => {
                  const query = parseVueRequest(id)
                  if (query.filename.endsWith('.vue') && !query.filename.split('/').includes('node_modules')) {
                    const sfc = parse(code)
                    for (const section of ['scriptSetup', 'script']) {
                      if (sfc.descriptor[section] && sfc.descriptor[section].lang === undefined) {
                        sfc.descriptor[section].content = await transform(sfc.descriptor[section].content, {
                          plugins: [['@babel/plugin-proposal-pipeline-operator', { proposal: 'fsharp' }]]
                        }).code
                      }
                    }
                    return vueSfcDescriptorToString(sfc.descriptor)
                  }
                  return code
                },
              }
            ],
            vue: {
              template: {
                transformAssetUrls: {
                  includeAbsolute: false,
                },
              },
            },
          },
        }
      `,
    })
  },
  supportedNodeVersions: [16, 18],
  useJobMatrix: true,
}
