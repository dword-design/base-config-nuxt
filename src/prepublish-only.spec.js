import withLocalTmpDir from 'with-local-tmp-dir'
import outputFiles from 'output-files'
import { endent } from '@dword-design/functions'
import { chmod } from 'fs-extra'
import execa from 'execa'
import P from 'path'

export default {
  cli: () => withLocalTmpDir(async () => {
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
          #!/usr/bin/env node

          import foo from './foo'

          console.log(foo)
        `,
        'foo.js': 'export default \'foo\'',
      },
    })

    await execa.command('base prepare')
    await execa.command('base prepublishOnly')
    await chmod(P.join('dist', 'cli.js'), '755')
    const { all } = await execa.command('./dist/cli.js', { all: true })
    expect(all).toEqual('foo')
  }),
  'linting error in cli': () => withLocalTmpDir(async () => {
    await outputFiles({
      'package.json': endent`
        {
          "baseConfig": "nuxt",
          "devDependencies": {
            "@dword-design/base-config-nuxt": "^1.0.0"
          }
        }

      `,
      'src/cli.js': endent`
        #!/usr/bin/env node

        console.log('foo');
      `,
    })

    await execa.command('base prepare')
    let all
    try {
      await execa.command('base prepublishOnly', { all: true })
    } catch (error) {
      all = error.all
    }
    expect(all).toMatch('error  Extra semicolon  semi')
  }),
}
