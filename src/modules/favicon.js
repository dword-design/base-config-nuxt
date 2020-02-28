import FaviconsWebpackPlugin from 'favicons-webpack-plugin'
import { exists } from 'fs-extra'
import P from 'path'

export default async function () {
  if (await exists(P.join(this.options.srcDir, 'favicon.png'))) {
    this.extendBuild(() => {
      config.plugins.push(new FaviconsWebpackPlugin(P.resolve(this.options.srcDir, 'favicon.png')))
    })
  }
}