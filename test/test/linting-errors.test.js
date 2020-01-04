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
        "baseConfig": "vue-app",
        "dependencies": {
          "vue": "^1.0.0"
        },
        "devDependencies": {
          "@dword-design/base-config-vue-app": "^1.0.0"
        }
      }

    `,
    src: {
      'app.vue': endent`
        <script>
        export default {
          render: () => <div>Hello world</div>,
        }
        </script>
      `,
      'index.js': endent`
        import Vue from '${getPackageName(require.resolve('vue'))}'
        import App from './app.vue'

        new Vue({
          el: '#app',
          render: () => <App />,
        })
      `,
    },
  })
  await spawn('base', ['build'])
  await outputFile('app.vue', endent`
    <script>
    export default {
      render: () => <div>Hello world</div>,
    };
    </script>
  `)
  let stdout
  try {
    await spawn('base', ['test'], { capture: ['stdout'] })
  } catch (error) {
    stdout = error.stdout
  }
  expect(stdout).toMatch('error  Extra semicolon  semi')
})
