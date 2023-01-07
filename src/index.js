import depcheckParserSass from '@dword-design/depcheck-parser-sass'
import packageName from 'depcheck-package-name'
import depcheckParserVue from 'depcheck-parser-vue'
import fs from 'fs-extra'

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
  coverageFileExtensions: ['.scss', '.vue'],
  depcheckConfig: {
    parsers: {
      '**/*.scss': depcheckParserSass,
      '**/*.vue': depcheckParserVue,
    },
    specials: [depcheckSpecial],
  },
  editorIgnore: ['.eslintcache', '.stylelintrc.json', '.nuxt', 'dist'],
  eslintConfig,
  gitignore: ['/.eslintcache', '/.nuxt', '/dist'],
  lint,
  npmPublish: true,
  packageConfig: {
    main: 'dist/index.js',
  },
  prepare: () =>
    fs.outputFile(
      '.stylelintrc.json',
      JSON.stringify(
        {
          extends: packageName`@dword-design/stylelint-config`,
        },
        undefined,
        2
      )
    ),
  useJobMatrix: true,
}
