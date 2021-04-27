import depcheckParserSass from '@dword-design/depcheck-parser-sass'
import packageName from 'depcheck-package-name'
import depcheckParserVue from 'depcheck-parser-vue'
import { outputFile } from 'fs-extra'

import analyze from './analyze'
import depcheckSpecial from './depcheck-special'
import dev from './dev'
import eslintConfig from './eslint.config'
import lint from './lint'
import prepublishOnly from './prepublish-only'
import start from './start'

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
      '*.scss': depcheckParserSass,
      '*.vue': depcheckParserVue,
    },
    specials: [depcheckSpecial],
  },
  editorIgnore: ['.stylelintrc.json', '.nuxt', 'dist'],
  eslintConfig,
  gitignore: ['/.nuxt', '/dist'],
  lint,
  npmPublish: true,
  packageConfig: {
    main: 'dist/index.js',
  },
  prepare: () =>
    outputFile(
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
