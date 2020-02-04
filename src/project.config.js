import safeRequire from 'safe-require'
import P from 'path'

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
  ...safeRequire(P.join(process.cwd(), 'src', 'index.js'))?.default ?? {},
}