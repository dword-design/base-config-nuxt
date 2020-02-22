import FaviconsWebpackPlugin from 'favicons-webpack-plugin'
import { existsSync } from 'fs-extra'
import P from 'path'

export default function () {
  this.extendBuild(config => {
    if (existsSync(P.join(this.options.srcDir, 'favicon.png'))) {
      config.plugins.push(new FaviconsWebpackPlugin(P.resolve(this.options.srcDir, 'favicon.png')))
    }
  })
}