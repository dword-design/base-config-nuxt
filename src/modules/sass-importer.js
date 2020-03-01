import importer from '@dword-design/node-sass-importer'

export default function () {
  this.options.build.loaders.scss.sassOptions = { importer }
  this.options.build.loaders.scss.webpackImporter = false
}