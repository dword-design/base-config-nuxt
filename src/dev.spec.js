import withLocalTmpDir from 'with-local-tmp-dir'
import outputFiles from 'output-files'
import execa from 'execa'
import { endent, includes, property } from '@dword-design/functions'
import portReady from 'port-ready'
import kill from 'tree-kill'
import waitFor from 'p-wait-for'
import axios from 'axios'

export default {
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
    const childProcess = execa.command('base dev')
    await portReady(3000)
    await waitFor(
      async () => axios.get('http://localhost:3000')
        |> await
        |> property('data')
        |> includes('<div>Hello world</div>'),
      { interval: 300 },
    )
    kill(childProcess.pid)
  }),
}