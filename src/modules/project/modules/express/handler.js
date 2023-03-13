import babelConfig from '@dword-design/babel-config'
import express from 'express'
import mountFiles from 'express-mount-files'
import { fromNodeMiddleware } from 'h3'
import jiti from 'jiti'
import P from 'path'

import options from '#express/options.js'

const jitiOptions = {
  esmResolve: true,
  interopDefault: true,
  transformOptions: {
    babel: babelConfig,
  },
}

const jitiInstance = jiti(options.srcDir, jitiOptions)
let app = express()
  .use(express.json())
  .use(express.urlencoded({ extended: false }))
try {
  const setupExpress = jitiInstance('./setup-express')
  app = setupExpress(app)
} catch (error) {
  if (!error.message.startsWith("Cannot find module './setup-express'")) {
    throw error
  }
}
app.use(
  '/api',
  mountFiles(P.resolve(options.srcDir, 'api'), {
    jitiOptions,
    paramChar: '_',
  }),
)

export default fromNodeMiddleware(app)
