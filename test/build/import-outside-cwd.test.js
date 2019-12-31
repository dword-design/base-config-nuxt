import withLocalTmpDir from 'with-local-tmp-dir'
import outputFiles from 'output-files'
import { spawn } from 'child-process-promise'
import { endent } from '@dword-design/functions'

export default () => withLocalTmpDir(__dirname, async () => {
  await outputFiles({
    'index.js': 'module.exports = 1;',
    inner: {
      'package.json': endent`
        {
          "baseConfig": "vue",
          "devDependencies": {
            "@dword-design/base-config-vue-app": "^1.0.0"
          }
        }

      `,
      'src/index.js': endent`
        import foo from '../..'
        console.log(foo)
      `,
    },
  })
  process.chdir('inner')
  await spawn('base', ['build'])
})
