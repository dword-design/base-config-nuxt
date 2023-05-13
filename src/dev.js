import { execaCommand } from 'execa'

export default (options = {}) => {
  options = { log: process.env.NODE_ENV !== 'test', ...options }

  return execaCommand('nuxt dev', {
    ...(options.log ? { stdio: 'inherit' } : {}),
    ...(process.env.NODE_ENV === 'test'
      ? { env: { NUXT_TELEMETRY_DISABLED: 1 } }
      : {}),
  })
}
