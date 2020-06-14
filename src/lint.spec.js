import withLocalTmpDir from 'with-local-tmp-dir'
import outputFiles from 'output-files'
import { endent } from '@dword-design/functions'
import execa from 'execa'
import lint from './lint'

export default {
  'css error': () =>
    withLocalTmpDir(async () => {
      await outputFiles({
        'assets/style.scss': endent`
          foo bar

        `,
        'package.json': JSON.stringify(
          {
            baseConfig: require.resolve('.'),
          },
          undefined,
          2
        ),
      })
      await execa.command('base prepare')
      await expect(lint()).rejects.toThrow('CssSyntaxError')
    }),
}
