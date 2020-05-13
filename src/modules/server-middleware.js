import P from 'path'
import express from 'express'
import mountFiles from 'express-mount-files'

export default function () {
  const app = express()
  app.use(mountFiles(P.join(this.options.srcDir, 'api'), { paramChar: '_' }))
  this.addServerMiddleware({ path: '/api', handler: app })
}
