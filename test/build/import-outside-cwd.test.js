import withLocalTmpDir from 'with-local-tmp-dir'
import outputFiles from 'output-files'
import { spawn } from 'child-process-promise'
import sortPackageJson from 'sort-package-json'
import { endent } from '@dword-design/functions'
import packageConfig from '../package.config'

export default () => withLocalTmpDir(__dirname, async () => {
  await outputFiles({
    'index.js': 'module.exports = 1;',
    inner: {
      'package.json': JSON.stringify(sortPackageJson({
        ...packageConfig,
        devDependencies: {
          '@dword-design/base-config-vue-app': '^1.0.0',
        },
      }), undefined, 2),
      'src/index.js': endent`
        import foo from '../..'
        console.log(foo)
      `,
    },
  })
  process.chdir('inner')
  await spawn('base', ['build'])
})
