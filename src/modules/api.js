import P from 'path'
import express from 'express'
import rainbow from 'rainbow'

export default function () {
  const app = express()
  app.use(rainbow({ controllers: P.join(this.options.srcDir, 'api') }))
  this.addServerMiddleware({ path: '/api', handler: app })
}
