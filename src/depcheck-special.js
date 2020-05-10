import P from 'path'

export default (filename, deps, rootDir) => {
  if (P.relative(rootDir, filename) !== P.join('src', 'index.js')) {
    return []
  }
  const config = require(filename)
  return config.modules || []
}