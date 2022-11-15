import express from 'express'
import mountFiles from 'express-mount-files'
import P from 'path'

export default function (options) {
  const app = options.expressInstance || express()
  app.use(mountFiles(P.join(this.options.srcDir, 'api'), { paramChar: '_' }))
  this.addServerMiddleware({ handler: app, path: '/api' })
  this.options.watch.push(P.join(this.options.srcDir, 'api'))
}
