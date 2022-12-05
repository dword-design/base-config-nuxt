import babelConfig from '@dword-design/babel-config'
import express from 'express'
import mountFiles from 'express-mount-files'
import P from 'path'

export default async function (options) {
  const app = (await options.getExpress?.()) || express()
  app.use(
    mountFiles(P.join(this.options.srcDir, 'api'), {
      jitiOptions: {
        esmResolve: true,
        interopDefault: true,
        transformOptions: {
          babel: babelConfig,
        },
      },
      paramChar: '_',
    })
  )
  this.addServerMiddleware({ handler: app, path: '/api' })
  this.options.watch.push(P.join(this.options.srcDir, 'api'))
}
