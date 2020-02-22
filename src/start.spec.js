import withLocalTmpDir from 'with-local-tmp-dir'
import outputFiles from 'output-files'
import execa from 'execa'
import { endent, property } from '@dword-design/functions'
import portReady from 'port-ready'
import axios from 'axios'
import kill from 'tree-kill'
import { mkdir } from 'fs-extra'
import start from './start'

export default {
  subdir: () => withLocalTmpDir(async () => {
    await outputFiles({
      'package.json': endent`
        {
          "baseConfig": "nuxt",
          "devDependencies": {
            "@dword-design/base-config-nuxt": "^1.0.0"
          }
        }

      `,
      'src/pages/index.js': endent`
        export default {
          render: () => <div>Hello world</div>,
        }
      `,
    })

    await execa.command('base prepare')
    await execa.command('base prepublishOnly')
    await mkdir('foo')
    process.chdir('foo')
    const childProcess = start({ rootDir: '..' })
    await portReady(3000)
    expect(axios.get('http://localhost:3000') |> await |> property('data')).toMatch('<div>Hello world</div>'),
    kill(childProcess.pid)
  }),
  valid: () => withLocalTmpDir(async () => {
    await outputFiles({
      'package.json': endent`
        {
          "baseConfig": "nuxt",
          "devDependencies": {
            "@dword-design/base-config-nuxt": "^1.0.0"
          }
        }

      `,
      'src/pages/index.js': endent`
        export default {
          render: () => <div>Hello world</div>,
        }
      `,
    })

    await execa.command('base prepare')
    await execa.command('base prepublishOnly')
    const childProcess = start()
    await portReady(3000)
    expect(axios.get('http://localhost:3000') |> await |> property('data')).toMatch('<div>Hello world</div>')
    kill(childProcess.pid)
  }),
}
