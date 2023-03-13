import { execaCommand } from 'execa'

export default (options = {}) => {
  options = { log: process.env.NODE_ENV !== 'test' }

  return execaCommand('nuxt dev', {
    ...(options.log ? { stdio: 'inherit' } : {}),
  })
}
