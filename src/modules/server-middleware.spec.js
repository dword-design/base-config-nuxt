import { endent, property } from '@dword-design/functions'
import tester from '@dword-design/tester'
import testerPluginTmpDir from '@dword-design/tester-plugin-tmp-dir'
import axios from 'axios'
import { Builder, Nuxt } from 'nuxt'
import outputFiles from 'output-files'

export default tester(
  {
    'parameter in filename': {
      config: {
        modules: [require.resolve('./server-middleware')],
      },
      files: {
        'api/foo/_param.get.js': endent`
        export default (req, res) => res.json({ foo: req.params.param })

      `,
      },
      test: async () => {
        const result =
          axios.get('http://localhost:3000/api/foo/abc')
          |> await
          |> property('data')
        expect(result).toEqual({ foo: 'abc' })
      },
    },
    'parameter casing': {
      config: {
        modules: [require.resolve('./server-middleware')],
      },
      files: {
        'api/foo/_paramFoo.get.js': endent`
        export default (req, res) => res.json({ foo: req.params.paramFoo })

      `,
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
      config: {
        modules: [require.resolve('./server-middleware')],
      },
      files: {
        'api/_param/foo.get.js': endent`
        export default (req, res) => res.json({ foo: req.params.param })

      `,
      },
      test: async () => {
        const result =
          axios.get('http://localhost:3000/api/abc/foo')
          |> await
          |> property('data')
        expect(result).toEqual({ foo: 'abc' })
      },
    },
    index: {
      config: {
        modules: [require.resolve('./server-middleware')],
      },
      files: {
        'api/_param/index.get.js': endent`
        export default (req, res) => res.json({ foo: req.params.param })

      `,
      },
      test: () => expect(axios.get('http://localhost:3000/api/abc')).rejects.toThrow('Request failed with status code 404'),
    },
    valid: {
      config: {
        modules: [require.resolve('./server-middleware')],
      },
      files: {
        'api/foo.get.js': endent`
        export default (req, res) => res.json({ foo: 'bar' })

      `,
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
    {
      transform: config => async () => {
        await outputFiles(config.files)

        const nuxt = new Nuxt({ dev: false, ...config.config })
        await new Builder(nuxt).build()
        await nuxt.listen()
        try {
          await config.test()
        } finally {
          await nuxt.close()
        }
      },
    },
    testerPluginTmpDir(),
  ]
)
