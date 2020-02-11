import P from 'path'
import babelConfig from '@dword-design/babel-config'
import safeRequire from 'safe-require'
import babelRegister from '@babel/register'
import nodeEnv from 'better-node-env'
import rootDir from './root-dir'

if (nodeEnv !== 'test') {
  babelRegister(babelConfig)
}

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
  ...safeRequire(P.join(rootDir, nodeEnv === 'test' ? 'src' : 'dist', 'index.js')) ?? {},
}