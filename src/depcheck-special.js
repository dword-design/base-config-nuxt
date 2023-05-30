import { filter, first, map } from '@dword-design/functions'
import jitiBabelTransform from '@dword-design/jiti-babel-transform'
import jiti from 'jiti'
import P from 'path'
import requirePackageName from 'require-package-name'

export default path => {
  if (P.basename(path) === 'config.js') {
    const jitiInstance = jiti(process.cwd(), {
      esmResolve: true,
      interopDefault: true,
      transform: jitiBabelTransform,
    })

    const config = jitiInstance('./config.js')

    const modules = [...(config.modules || []), ...(config.buildModules || [])]

    return (
      modules
      |> map(mod => [].concat(mod) |> first)
      |> filter(name => typeof name === 'string')
      |> map(name => requirePackageName(name))
    )
  }

  return []
}
