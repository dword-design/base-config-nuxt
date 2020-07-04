import { endent, mapValues, property } from '@dword-design/functions'
import axios from 'axios'
import { Builder, Nuxt } from 'nuxt'
import outputFiles from 'output-files'
import withLocalTmpDir from 'with-local-tmp-dir'

const runTest = config => () =>
  withLocalTmpDir(async () => {
    await outputFiles(config.files)
    const nuxt = new Nuxt({
      ...config.config,
      build: { quiet: true },
      dev: false,
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
} |> mapValues(runTest)
