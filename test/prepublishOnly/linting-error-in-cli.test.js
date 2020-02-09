import withLocalTmpDir from 'with-local-tmp-dir'
import outputFiles from 'output-files'
import { spawn } from 'child-process-promise'
import { endent } from '@dword-design/functions'

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
    'src/cli.js': endent`
      #!/usr/bin/env node
      
      console.log('foo');
    `,
  })
  
  await spawn('base', ['prepare'])
  let stdout
  try {
    await spawn('base', ['prepublishOnly'], { capture: ['stdout'] })
  } catch (error) {
    stdout = error.stdout
  }
  expect(stdout).toMatch('error  Extra semicolon  semi')
})
