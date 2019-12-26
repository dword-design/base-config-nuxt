import resolverTest from '@dword-design/resolver-test'

export default class {

  apply(resolver) {
    const target = resolver.ensureHook('resolve')
    resolver
      .getHook('resolve')
      .tapAsync('ResolverTestWebpackPlugin', (request, resolveContext, callback) => {
        const path = resolverTest(request.request)
        return path !== undefined
          ? resolver.doResolve(
            target,
            { ...request, ...path !== undefined ? { request: path } : {} },
            null,
            resolveContext,
            callback
          )
          : callback()
      })
  }
}
