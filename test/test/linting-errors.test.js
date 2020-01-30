import withLocalTmpDir from 'with-local-tmp-dir'
import outputFiles from 'output-files'
import { spawn } from 'child-process-promise'
import { endent } from '@dword-design/functions'
import getPackageName from 'get-package-name'
import expect from 'expect'
import { outputFile } from 'fs-extra'

export default () => withLocalTmpDir(__dirname, async () => {
  await outputFiles({
    'package.json': endent`
      {
        "baseConfig": "nuxt",
        "dependencies": {
          "vue": "^1.0.0"
        },
        "devDependencies": {
          "@dword-design/base-config-nuxt": "^1.0.0"
        }
      }

    `,
    src: {
      'app.js': endent`
        export default {
          render: () => <div>Hello world</div>,
        }
      `,
      'index.js': endent`
        import Vue from '${getPackageName(require.resolve('vue'))}'
        import App from './app'

        new Vue({
          el: '#app',
          render: () => <App />,
        })
      `,
    },
  })
  await spawn('base', ['build'])
  await outputFile('app.js', endent`
    export default {
      render: () => <div>Hello world</div>,
    };
  `)
  let stdout
  try {
    await spawn('base', ['test'], { capture: ['stdout'] })
  } catch (error) {
    stdout = error.stdout
  }
  expect(stdout).toMatch('error  Extra semicolon  semi')
})
