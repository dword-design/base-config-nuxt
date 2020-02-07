import P from 'path'
import babelConfig from '@dword-design/babel-config'
import * as babel from '@babel/core'
import requireFromString from 'require-from-string'
import { existsSync } from 'fs-extra'

export default {
  title: 'Vue app',
  modules: [],
  cssVariables: {},
  breakpoints: {
    sm: '@media (min-width: 576px)',
    md: '@media (min-width: 768px)',
    lg: '@media (min-width: 992px)',
    xl: '@media (min-width: 1200px)',
  },
  ...existsSync(P.join('src', 'index.js'))
    ? requireFromString(
      babel.transformFileSync(P.join('src', 'index.js'), babelConfig).code,
      P.join('src', 'index.js'),
    )
    : {},
}