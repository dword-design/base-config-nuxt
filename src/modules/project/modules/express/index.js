import { addServerHandler, addTemplate, createResolver } from '@nuxt/kit'
import P from 'path'

const resolver = createResolver(import.meta.url)

const moduleName = 'express'

export default (options, nuxt) => {
  addTemplate({
    filename: P.join(moduleName, 'options.js'),
    getContents: () =>
      `export default ${JSON.stringify(
        { srcDir: nuxt.options.srcDir },
        undefined,
        2
      )}`,
    write: true,
  })
  nuxt.options.alias[`#${moduleName}`] = P.resolve(
    nuxt.options.buildDir,
    moduleName
  )
  addServerHandler({ handler: resolver.resolve('./handler') })
}
