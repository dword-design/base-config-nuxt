import { Base } from '@dword-design/base'
import { endent } from '@dword-design/functions'
import tester from '@dword-design/tester'
import testerPluginTmpDir from '@dword-design/tester-plugin-tmp-dir'
import { execaCommand } from 'execa'
import fs from 'fs-extra'
import outputFiles from 'output-files'
import P from 'path'

import config from './index.js'
import self from './prepublish-only.js'

export default tester(
  {
    cli: async () => {
      await outputFiles({
        model: {
          'cli.js': endent`
          #!/usr/bin/env node

          import foo from './foo.js'

          console.log(foo)
        `,
          'foo.js': "export default 'foo'",
        },
        'package.json': JSON.stringify({ type: 'module' }),
      })
      await new Base(config).prepare()
      await self()
      await fs.chmod(P.join('dist', 'cli.js'), '755')

      const output = await execaCommand('./dist/cli.js', { all: true })
      expect(output.all).toMatch(/^foo$/m)
    },
    'fixable linting error': async () => {
      await outputFiles({
        'package.json': JSON.stringify({}),
        'pages/index.vue': endent`
        <template>
          <div />
        </template>
        <script>
        export default {};
        </script>

      `,
      })
      await new Base(config).prepare()
      await self()
      expect(await fs.readFile(P.join('pages', 'index.vue'), 'utf8'))
        .toEqual(endent`
        <template>
          <div />
        </template>
        <script>
        export default {}
        </script>

      `)
    },
    'linting error in cli': async () => {
      await outputFiles({
        'model/cli.js': endent`
        #!/usr/bin/env node

        const foo = 'bar'

      `,
        'package.json': JSON.stringify({}),
      })
      await new Base(config).prepare()
      let output
      try {
        await self()
      } catch (error) {
        output = error.message
      }
      expect(output).toMatch("'foo' is assigned a value but never used")
    },
  },
  [testerPluginTmpDir()]
)
