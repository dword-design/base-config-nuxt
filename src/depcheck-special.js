import { filter, first, map } from '@dword-design/functions'
import P from 'path'

export default async path => {
  try {
    if (P.basename(path) === 'nuxt.config.js') {
      const config = (await import(path)).default

      const modules = [...(config.modules || []), ...(config.buildModules || [])]

      return (
        modules
        |> map(mod => [].concat(mod) |> first)
        |> filter(name => typeof name === 'string')
      )
    }
  } catch (error) {
    console.log(error)
  }

  return []
}
