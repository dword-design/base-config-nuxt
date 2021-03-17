import { filter, first, map } from '@dword-design/functions'
import P from 'path'
import babelRegister from '@babel/register'

export default filename => {
  if (P.basename(filename) === 'nuxt.config.js') {
    babelRegister()
    const config = require(filename)
    const modules = [...(config.modules || []), ...(config.buildModules || [])]
    return (
      modules
      |> map(mod => [].concat(mod) |> first)
      |> filter(name => typeof name === 'string')
    )
  }
  return []
}
