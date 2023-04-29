import jitiBabelTransform from '@dword-design/jiti-babel-transform'
import express from 'express'
import mountFiles from 'express-mount-files'
import P from 'path'

export default async function (options) {
  // Make sure that we do not register the server middleware
  // on build because processes like express-mysql-session do
  // not get closed
  // https://github.com/nuxt/nuxt.js/blob/2ec62617ced873fef97c73a6d7aa1271911ccfd5/packages/core/src/nuxt.js#L56
  if (this.options.server !== false) {
    const app = (await options.getExpress?.()) || express()
    app.use(
      mountFiles(P.join(this.options.srcDir, 'api'), {
        jitiOptions: {
          esmResolve: true,
          interopDefault: true,
          transform: jitiBabelTransform,
        },
        paramChar: '_',
      }),
    )
    this.addServerMiddleware({ handler: app, path: '/api' })
    this.options.watch.push(P.join(this.options.srcDir, 'api'))
  }
}
