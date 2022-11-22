import { endent, property } from '@dword-design/functions'
import tester from '@dword-design/tester'
import testerPluginTmpDir from '@dword-design/tester-plugin-tmp-dir'
import axios from 'axios'
import express from 'express'
import { Builder, Nuxt } from 'nuxt'
import outputFiles from 'output-files'
import self from './index.js'

export default tester(
  {
    expressInstance: {
      config: {
        modules: [
          [
            self,
            {
              expressInstance: express().use((req, res, next) => {
                req.foo = 'bar'
                next()
              }),
            },
          ],
        ],
      },
      files: {
        'api/foo.get.js': endent`
        export default (req, res) => res.json({ foo: req.foo })

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
    index: {
      config: {
        modules: [self],
      },
      files: {
        'api/_param/index.get.js': endent`
        export default (req, res) => res.json({ foo: req.params.param })

      `,
      },
      test: () =>
        expect(axios.get('http://localhost:3000/api/abc')).rejects.toThrow(
          'Request failed with status code 404'
        ),
    },
    'parameter casing': {
      config: {
        modules: [self],
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
    'parameter in filename': {
      config: {
        modules: [self],
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
    'parameter in folder name': {
      config: {
        modules: [self],
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
        modules: [self],
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
