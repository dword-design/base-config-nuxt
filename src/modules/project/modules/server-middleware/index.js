import express from 'express'
import mountFiles from 'express-mount-files'
import P from 'path'

export default async function (options) {
  const app = options.expressInstance || express()
  app.use(
    await mountFiles(P.join(this.options.srcDir, 'api'), { paramChar: '_' })
  )
  this.addServerMiddleware({ handler: app, path: '/api' })
  this.options.watch.push(P.join(this.options.srcDir, 'api'))
}
