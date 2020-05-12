import P from 'path'
import { map, first } from '@dword-design/functions'

export default (filename, deps, rootDir) => {
  if (P.relative(rootDir, filename) !== P.join('src', 'index.js')) {
    return []
  }
  const config = require(filename)
  const modules = config.modules || []
  return modules |> map(mod => (Array.isArray(mod) ? mod |> first : mod))
}
