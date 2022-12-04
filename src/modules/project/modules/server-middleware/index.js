import express from 'express'
import mountFiles from 'express-mount-files'
import P from 'path'
import babelConfig from '@dword-design/babel-config'

export default async function (options) {
  const app = options.expressInstance || express()
  app.use(mountFiles(P.join(this.options.srcDir, 'api'), {
    paramChar: '_',
    jitiOptions: {
      esmResolve: true,
      interopDefault: true,
      transformOptions: {
        babel: babelConfig,
      },
    }
  }))
  this.addServerMiddleware({ handler: app, path: '/api' })
  this.options.watch.push(P.join(this.options.srcDir, 'api'))
}
