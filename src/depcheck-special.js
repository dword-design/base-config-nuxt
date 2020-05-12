import P from 'path'
import { map, first } from '@dword-design/functions'

export default filename => {
  if (P.basename(filename) === 'nuxt.config.js') {
    const config = require(filename)
    const modules = config.modules || []
    return modules |> map(mod => [].concat(mod) |> first)
  }
  return []
}
