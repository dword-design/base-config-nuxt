import depcheckParserSass from '@dword-design/depcheck-parser-sass'
import { endent } from '@dword-design/functions'
import packageName from 'depcheck-package-name'
import depcheckParserVue from 'depcheck-parser-vue'
import outputFiles from 'output-files'

import analyze from './analyze.js'
import depcheckSpecial from './depcheck-special.js'
import dev from './dev.js'
import eslintConfig from './eslint.config.js'
import getNuxtConfig from './get-nuxt-config.js'
import lint from './lint.js'
import prepublishOnly from './prepublish-only.js'
import start from './start.js'

export { getNuxtConfig }

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
    'nuxt.config.js',
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
  ],
  eslintConfig,
  gitignore: ['/.eslintcache', '/.nuxt', '/app.vue', '/dist'],
  lint,
  npmPublish: true,
  packageConfig: {
    main: 'dist/index.js',
  },
  prepare: () =>
    outputFiles({
      '.stylelintrc.json': JSON.stringify(
        {
          extends: packageName`@dword-design/stylelint-config`,
        },
        undefined,
        2
      ),
      'app.vue': endent`
        <template>
          <NuxtLayout>
            <NuxtPage />
          </NuxtLayout>
        </template>

        <script setup>
        const config = useRuntimeConfig()

        useHead({
          titleTemplate: title => title
            ? \`\${title} | \${config.name}\`
            : [
                config.name,
                ...(config.title ? [config.title] : []),
              ].join(': '),
        })
        </script>
      `,
    }),
  useJobMatrix: true,
}
