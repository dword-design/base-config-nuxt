import safeRequire from 'safe-require'
import P from 'path'

export default {
  title: 'Vue app',
  modules: [],
  cssVariables: {},
  ...safeRequire(P.join(process.cwd(), 'src', 'index.js'))?.default ?? {},
}