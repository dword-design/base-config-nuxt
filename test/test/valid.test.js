import withLocalTmpDir from 'with-local-tmp-dir'
import outputFiles from 'output-files'
import { spawn } from 'child-process-promise'
import sortPackageJson from 'sort-package-json'
import { endent } from '@dword-design/functions'
import getPackageName from 'get-package-name'
import packageConfig from '../package.config'

export default () => withLocalTmpDir(__dirname, async () => {
  await outputFiles({
    'package.json': JSON.stringify(sortPackageJson({
      ...packageConfig,
      dependencies: {
        'vue': '^1.0.0',
      },
      devDependencies: {
        '@dword-design/base-config-vue-app': '^1.0.0',
      },
    }), undefined, 2),
    'src/index.js': endent`
      import Vue from '${getPackageName(require.resolve('vue'))}'

      new Vue({
        el: '#app',
        render: () => <div>Hello world</div>,
      })
    `,
  })

  await spawn('base', ['build'])
  await spawn('base', ['test'])
})
