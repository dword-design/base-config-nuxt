import { execa } from 'execa'
import { createRequire } from 'module'

const _require = createRequire(import.meta.url)

const nuxtWrapper = _require.resolve('./nuxt-wrapper.js')

export default (options = {}) => {
  options = {
    log: process.env.NODE_ENV !== 'test',
    ...options,
  }

  return execa(nuxtWrapper, ['dev'], {
    [options.log ? 'stdio' : 'stderr']: 'inherit',
    env: {
      NODE_ENV: '',
      NODE_OPTIONS:
        '--require=suppress-experimental-warnings --require=@dword-design/suppress-babel-register-esm-warning --experimental-loader=babel-register-esm',
    },
  })
}
