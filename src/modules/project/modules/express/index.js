import { addServerHandler, addTemplate, createResolver } from '@nuxt/kit'
import P from 'path'
import nuxtAliasPath from 'nuxt-alias-path'

const resolver = createResolver(import.meta.url)

const moduleName = 'express'

export default (options, nuxt) => {
  addTemplate({
    filename: P.join(moduleName, 'options.js'),
    getContents: () =>
      `export default ${JSON.stringify(
        { srcDir: nuxt.options.srcDir },
        undefined,
        2,
      )}`,
    write: true,
  })
  nuxt.options.alias[`#${moduleName}`] = nuxtAliasPath(moduleName, nuxt)
  addServerHandler({ handler: resolver.resolve('./handler') })
}
