export default function () {
  this.options.head.link.push({ rel: 'stylesheet', href: '/acss.css' })
  this.extendBuild(config => {
    config.module.rules
      .find(({ test }) => test.test('.js'))
      .use
      .unshift({
        loader: require.resolve('webpack-atomizer-loader'),
        query: {
          configPath: require.resolve('./config.js'),
        },
      }),
    })
}