import withLocalTmpDir from 'with-local-tmp-dir'
import outputFiles from 'output-files'
import { endent, property } from '@dword-design/functions'
import P from 'path'
import execa from 'execa'
import axios from 'axios'
import kill from 'tree-kill-promise'
import { mkdir, chmod } from 'fs-extra'
import portReady from 'port-ready'
import start from './start'

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
    await execa.command('base prepublishOnly')
    const childProcess = start()
    await portReady(3000)
    const html = axios.get('http://localhost:3000') |> await |> property('data')
    expect(html).toMatch('<div>Hello world</div>')
    await kill(childProcess.pid)
  }),
  'sass import': () => withLocalTmpDir(async () => {
    await outputFiles({
      'node_modules/sass-foo': {
        'package.json': endent`
          {
            "main": "index.scss"
          }
        `,
        'index.scss': endent`
          body {
            background: red;
          }
        `,
      },
      'package.json': endent`
        {
          "baseConfig": "nuxt",
          "dependencies": {
            "sass-foo": "^1.0.0"
          },
          "devDependencies": {
            "@dword-design/base-config-nuxt": "^1.0.0"
          }
        }

      `,
      src: {
        'assets/style.scss': '@import \'~sass-foo\'',
        'index.js': endent`
          export default {
            css: [
              '~/assets/style.scss',
            ],
          }
        `,
        'pages/index.js': endent`
          export default {
            render: () => <div>Hello world</div>,
          }
        `,
      },
    })
    await execa.command('base prepare')
    await execa.command('base prepublishOnly')
    const childProcess = start()
    await portReady(3000)
    const html = axios.get('http://localhost:3000') |> await |> property('data')
    expect(html).toMatch('body{background:red}')
    expect(html).toMatch('<div>Hello world</div>')
    await kill(childProcess.pid)
  }),
  sass: () => withLocalTmpDir(async () => {
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
        'assets/style.scss': endent`
          body {
            background: red;
          }
        `,
        'index.js': endent`
          export default {
            css: [
              '~/assets/style.scss',
            ],
          }
        `,
        'pages/index.js': endent`
          export default {
            render: () => <div>Hello world</div>,
          }
        `,
      },
    })
    await execa.command('base prepare')
    await execa.command('base prepublishOnly')
    const childProcess = start()
    await portReady(3000)
    const html = axios.get('http://localhost:3000') |> await |> property('data')
    expect(html).toMatch('body{background:red}')
    expect(html).toMatch('<div>Hello world</div>')
    await kill(childProcess.pid)
  }),
  subdir: () => withLocalTmpDir(async () => {
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
    await execa.command('base prepublishOnly')
    await mkdir('foo')
    process.chdir('foo')
    const childProcess = start({ rootDir: '..' })
    await portReady(3000)
    expect(axios.get('http://localhost:3000') |> await |> property('data')).toMatch('<div>Hello world</div>'),
    await kill(childProcess.pid)
  }),
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
