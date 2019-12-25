import withLocalTmpDir from 'with-local-tmp-dir'
import outputFiles from 'output-files'
import { spawn } from 'child-process-promise'
import sortPackageJson from 'sort-package-json'
import { endent } from '@dword-design/functions'
import packageConfig from '../package.config'

export default () => withLocalTmpDir(__dirname, async () => {
  await outputFiles({
    inner: {
      'package.json': JSON.stringify(sortPackageJson({
        ...packageConfig,
        name: 'bar',
        devDependencies: {
          '@dword-design/base-config-vue-app': '^1.0.0',
          expect: '^1.0.0',
        },
      }), undefined, 2),
      'src/index.js': endent`
        import foo from 'foo'

        export default foo
      `,
      'test/valid.test.js': endent`
        import bar from 'bar'
        import expect from 'expect'

        export default () => expect(bar).toEqual(1)
      `,
    },
    'package.json': JSON.stringify(sortPackageJson(packageConfig), undefined, 2),
    'src/index.js': 'export default 1',
  })

  process.chdir('inner')
  await spawn('base', ['build'])
  await spawn('base', ['test'])
})
