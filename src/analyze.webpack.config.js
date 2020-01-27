import webpackMerge from 'webpack-merge'
import WebpackBundleAnalyzer from 'webpack-bundle-analyzer'
import config from './webpack.config'

export default webpackMerge(
  ...config,
  {
    plugins: [
      new WebpackBundleAnalyzer.BundleAnalyzerPlugin,
    ],
  },
)
