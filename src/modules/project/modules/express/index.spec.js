import { endent, property } from '@dword-design/functions'
import tester from '@dword-design/tester'
import testerPluginEnv from '@dword-design/tester-plugin-env'
import testerPluginTmpDir from '@dword-design/tester-plugin-tmp-dir'
import { buildNuxt, loadNuxt } from '@nuxt/kit'
import axios from 'axios'
import { execaCommand } from 'execa'
import outputFiles from 'output-files'
import kill from 'tree-kill-promise'
import waitPort from 'wait-port'

export default tester(
  {
    'error in express.js': {
      files: {
        'setup-express.js': "throw new Error('foo')",
      },
      runtimeError: 'Error: foo',
    },
    'parameter casing': {
      files: {
        'api/foo/_paramFoo.get.js':
          'export default (req, res) => res.send({ foo: req.params.paramFoo })',
      },
      test: async () => {
        const result =
          axios.get('http://localhost:3000/api/foo/abc')
          |> await
          |> property('data')
        expect(result).toEqual({ foo: 'abc' })
      },
    },
    'parameter in filename': {
      files: {
        'api/foo/_param.get.js':
          'export default (req, res) => res.send({ foo: req.params.param })',
      },
      test: async () => {
        const result =
          axios.get('http://localhost:3000/api/foo/abc')
          |> await
          |> property('data')
        expect(result).toEqual({ foo: 'abc' })
      },
    },
    'parameter in folder name': {
      files: {
        'api/_param/foo.get.js':
          'export default (req, res) => res.send({ foo: req.params.param })',
      },
      test: async () => {
        const result =
          axios.get('http://localhost:3000/api/abc/foo')
          |> await
          |> property('data')
        expect(result).toEqual({ foo: 'abc' })
      },
    },
    'setup-express.js': {
      files: {
        'api/foo.get.js':
          'export default (req, res) => res.send({ foo: req.foo })',
        'setup-express.js':
          "export default app => app.use((req, res, next) => { req.foo = 'bar'; next() })",
      },
      test: async () => {
        const result =
          axios.get('http://localhost:3000/api/foo')
          |> await
          |> property('data')
        expect(result).toEqual({ foo: 'bar' })
      },
    },
    valid: {
      files: {
        'api/foo.get.js':
          "export default (req, res) => res.send({ foo: 'bar' })",
      },
      test: async () => {
        const result =
          axios.get('http://localhost:3000/api/foo')
          |> await
          |> property('data')
        expect(result).toEqual({ foo: 'bar' })
      },
    },
  },
  [
    testerPluginTmpDir(),
    {
      transform: config => {
        config = { output: '', test: () => {}, ...config }

        return async () => {
          await outputFiles({
            'nuxt.config.js': endent`
              export default {
                modules: ['../src/modules/project/modules/express/index.js'],
              }
            `,
            ...config.files,
          })

          const nuxt = await loadNuxt({
            overrides: { telemetry: false, vite: { logLevel: 'error' } },
          })
          await buildNuxt(nuxt)
          if (config.runtimeError) {
            await expect(execaCommand('nuxt start')).rejects.toThrow(
              config.runtimeError,
            )
          } else {
            const childProcess = execaCommand('nuxt start')
            try {
              await waitPort({ output: 'silent', port: 3000 })
              await config.test()
            } finally {
              await kill(childProcess.pid)
            }
          }
        }
      },
    },
  ],
)
