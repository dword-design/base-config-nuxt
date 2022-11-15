import dotenv from '@dword-design/dotenv-json-extended'
import esm from 'esm'

dotenv.config()

export default {
  createRequire: () => esm(module),
  modules: [require.resolve('./modules/project')],
}
