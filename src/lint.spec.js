import { endent } from '@dword-design/functions'
import execa from 'execa'
import { outputFile } from 'fs-extra'
import outputFiles from 'output-files'
import withLocalTmpDir from 'with-local-tmp-dir'

import lint from './lint'

export default {
  'css error': () =>
    withLocalTmpDir(async () => {
      await outputFiles({
        'assets/style.scss': endent`
          foo bar

        `,
        'node_modules/base-config-self/index.js':
          "module.exports = require('../../../src')",
        'package.json': JSON.stringify(
          {
            baseConfig: 'self',
          },
          undefined,
          2
        ),
      })
      await execa.command('base prepare')
      await expect(lint()).rejects.toThrow('CssSyntaxError')
    }),
  ignored: () =>
    withLocalTmpDir(async () => {
      await outputFiles({
        'node_modules/base-config-self/index.js':
          "module.exports = require('../../../src')",
        'package.json': JSON.stringify(
          {
            baseConfig: 'self',
          },
          undefined,
          2
        ),
      })
      await execa.command('base prepare')
      await outputFile(
        'coverage/foo.scss',
        endent`
        foo bar

      `
      )
      await lint()
    }),
}
