import { endent, includes, property } from '@dword-design/functions'
import axios from 'axios'
import execa from 'execa'
import outputFiles from 'output-files'
import waitFor from 'p-wait-for'
import portReady from 'port-ready'
import kill from 'tree-kill-promise'
import withLocalTmpDir from 'with-local-tmp-dir'

export default {
  valid: () =>
    withLocalTmpDir(async () => {
      await outputFiles({
        'package.json': JSON.stringify(
          {
            baseConfig: require.resolve('.'),
          },
          undefined,
          2
        ),
        'pages/index.vue': endent`
          <template>
            <div>Hello world</div>
          </template>

        `,
      })
      await execa.command('base prepare')
      const childProcess = execa.command('base dev')
      try {
        await portReady(3000)
        await waitFor(
          async () =>
            axios.get('http://localhost:3000')
            |> await
            |> property('data')
            |> includes('<div>Hello world</div>'),
          { interval: 300 }
        )
      } finally {
        await kill(childProcess.pid)
      }
    }),
}
