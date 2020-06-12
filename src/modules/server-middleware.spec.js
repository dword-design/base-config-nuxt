import withLocalTmpDir from 'with-local-tmp-dir'
import outputFiles from 'output-files'
import { endent, mapValues, property } from '@dword-design/functions'
import { Nuxt, Builder } from 'nuxt'
import axios from 'axios'

const runTest = config => () =>
  withLocalTmpDir(async () => {
    await outputFiles(config.files)
    const nuxt = new Nuxt({
      ...config.config,
      dev: false,
      build: { quiet: true },
    })
    await new Builder(nuxt).build()
    await nuxt.listen()
    try {
      await config.test()
    } finally {
      await nuxt.close()
    }
  })

export default {
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
        axios.get('http://localhost:3000/api/foo') |> await |> property('data')
      expect(result).toEqual({ foo: 'bar' })
    },
  },
  'parameter before': {
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
  'parameter after': {
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
} |> mapValues(runTest)
