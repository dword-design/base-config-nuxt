import babelConfig from '@dword-design/babel-config'
import { filter, first, map } from '@dword-design/functions'
import jiti from 'jiti'
import P from 'path'

export default path => {
  if (P.basename(path) === 'nuxt.config.js') {
    const jitiInstance = jiti(process.cwd(), {
      esmResolve: true,
      interopDefault: true,
      transformOptions: {
        babel: babelConfig,
      },
    })

    const config = jitiInstance(`./nuxt.config.js`)

    const modules = [...(config.modules || []), ...(config.buildModules || [])]

    return (
      modules
      |> map(mod => [].concat(mod) |> first)
      |> filter(name => typeof name === 'string')
    )
  }

  return []
}
