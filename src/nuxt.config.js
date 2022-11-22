import dotenv from '@dword-design/dotenv-json-extended'
import projectModule from './modules/project/index.js'

dotenv.config()

export default {
  modules: [projectModule],
}
