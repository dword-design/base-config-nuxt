import dotenv from '@dword-design/dotenv-json-extended'
import projectModule from './modules/project/index.js'

export default () => {
  dotenv.config()
  return {
    modules: [projectModule],
  }
}
