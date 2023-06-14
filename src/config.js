import dotenv from '@dword-design/dotenv-json-extended'
import jitiBabelTransform from '@dword-design/jiti-babel-transform'
import jiti from 'jiti'

dotenv.config()
let config
try {
  const jitiInstance = jiti(process.cwd(), {
    esmResolve: true,
    interopDefault: true,
    transform: jitiBabelTransform,
  })
  config = jitiInstance('./config.js')
} catch (error) {
  if (error.message.startsWith("Cannot find module './config.js'\n")) {
    config = {}
  } else {
    throw error
  }
}

export default { name: 'Vue app', userScalable: true, ...config }
