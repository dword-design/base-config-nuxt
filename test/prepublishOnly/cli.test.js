import withLocalTmpDir from 'with-local-tmp-dir'
import outputFiles from 'output-files'
import { endent } from '@dword-design/functions'
import { chmod } from 'fs-extra'
import { spawn } from 'child-process-promise'

export default () => withLocalTmpDir(__dirname, async () => {
  await outputFiles({
    'package.json': endent`
      {
        "baseConfig": "nuxt",
        "devDependencies": {
          "@dword-design/base-config-nuxt": "^1.0.0"
        }
      }

    `,
    src: {
      'cli.js': endent`
        import foo from './foo'

        console.log(foo)
      `,
      'foo.js': 'export default \'foo\'',
    },
  })

  await spawn('base', ['prepublishOnly'])
  await chmod('dist/cli.js', '755')
  const { stdout } = await spawn('node', ['./dist/cli.js'], { capture: ['stdout'] })
  expect(stdout).toEqual('foo\n')
})
