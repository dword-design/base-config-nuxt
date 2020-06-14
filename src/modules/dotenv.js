import dotenv from '@dword-design/dotenv-json-extended'
import P from 'path'

export default function () {
  dotenv.config()
  this.options.watch.push(
    P.join(this.options.rootDir, '.env.json'),
    P.join(this.options.rootDir, '.env.schema.json')
  )
}
