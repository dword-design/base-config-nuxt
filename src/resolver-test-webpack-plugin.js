import resolverTest from '@dword-design/resolver-test'

export default class {

  constructor() {
    this.source = 'resolve'
    this.target = 'parsedResolve'
  }

  apply(resolver) {
    const target = resolver.ensureHook(this.target)
    resolver
      .getHook(this.source)
      .tapAsync('ResolverTestWebpackPlugin', (request, resolveContext, callback) => {
        const path = resolverTest(request.request)
        resolver.doResolve(
          target,
          { ...request, ...path !== undefined ? { request: path } : {} },
          null,
          resolveContext,
          callback
        )
      })
  }
}
