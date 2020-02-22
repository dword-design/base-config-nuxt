import execa from 'execa'

export default ({ log = true, rootDir } = {}) => execa(
  'nuxt',
  ['start', '--config-file', require.resolve('./nuxt.config')],
  { stdio: log ? 'inherit' : 'ignore', env: { ...process.env, NUXT_ROOT_DIR: rootDir } },
)
