import { endent, property } from '@dword-design/functions'
import tester from '@dword-design/tester'
import testerPluginTmpDir from '@dword-design/tester-plugin-tmp-dir'
import axios from 'axios'
import { execaCommand } from 'execa'
import fs from 'fs-extra'
import outputFiles from 'output-files'
import portReady from 'port-ready'
import kill from 'tree-kill-promise'

export default tester(
  {
    'error in express.js': async () => {
      await fs.outputFile('setup-express.js', "throw new Error('foo')")
      await execaCommand('nuxt build')
      await expect(
        execaCommand('nuxt start', {
          env: { NUXT_TELEMETRY_DISABLED: 1 },
        }),
      ).rejects.toThrow('Error: foo')
    },
    'parameter casing': async () => {
      await fs.outputFile(
        'api/foo/_paramFoo.get.js',
        'export default (req, res) => res.send({ foo: req.params.paramFoo })',
      )
      await execaCommand('nuxt build', { env: { NUXT_TELEMETRY_DISABLED: 1 } })

      const nuxt = execaCommand('nuxt start')
      try {
        await portReady(3000)

        const result =
          axios.get('http://localhost:3000/api/foo/abc')
          |> await
          |> property('data')
        expect(result).toEqual({ foo: 'abc' })
      } finally {
        await kill(nuxt.pid)
      }
    },
    'parameter in filename': async () => {
      await fs.outputFile(
        'api/foo/_param.get.js',
        'export default (req, res) => res.send({ foo: req.params.param })',
      )
      await execaCommand('nuxt build', { env: { NUXT_TELEMETRY_DISABLED: 1 } })

      const nuxt = execaCommand('nuxt start')
      try {
        await portReady(3000)

        const result =
          axios.get('http://localhost:3000/api/foo/abc')
          |> await
          |> property('data')
        expect(result).toEqual({ foo: 'abc' })
      } finally {
        await kill(nuxt.pid)
      }
    },
    'parameter in folder name': async () => {
      await fs.outputFile(
        'api/_param/foo.get.js',
        'export default (req, res) => res.send({ foo: req.params.param })',
      )
      await execaCommand('nuxt build', { env: { NUXT_TELEMETRY_DISABLED: 1 } })

      const nuxt = execaCommand('nuxt start')
      try {
        await portReady(3000)

        const result =
          axios.get('http://localhost:3000/api/abc/foo')
          |> await
          |> property('data')
        expect(result).toEqual({ foo: 'abc' })
      } finally {
        await kill(nuxt.pid)
      }
    },
    'setup-express.js': async () => {
      await outputFiles({
        'api/foo.get.js':
          'export default (req, res) => res.send({ foo: req.foo })',
        'setup-express.js':
          "export default app => app.use((req, res, next) => { req.foo = 'bar'; next() })",
      })
      await execaCommand('nuxt build', { env: { NUXT_TELEMETRY_DISABLED: 1 } })

      const nuxt = execaCommand('nuxt start')
      try {
        await portReady(3000)

        const result =
          axios.get('http://localhost:3000/api/foo')
          |> await
          |> property('data')
        expect(result).toEqual({ foo: 'bar' })
      } finally {
        await kill(nuxt.pid)
      }
    },
    valid: async () => {
      await fs.outputFile(
        'api/foo.get.js',
        "export default (req, res) => res.send({ foo: 'bar' })",
      )
      await execaCommand('nuxt build', { env: { NUXT_TELEMETRY_DISABLED: 1 } })

      const nuxt = execaCommand('nuxt start')
      try {
        await portReady(3000)

        const result =
          axios.get('http://localhost:3000/api/foo')
          |> await
          |> property('data')
        expect(result).toEqual({ foo: 'bar' })
      } finally {
        await kill(nuxt.pid)
      }
    },
  },
  [
    testerPluginTmpDir(),
    {
      beforeEach: () =>
        fs.outputFile(
          'nuxt.config.js',
          endent`
            export default {
              modules: ['../src/modules/project/modules/express/index.js'],
            }
          `,
        ),
    },
  ],
)
