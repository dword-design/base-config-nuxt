import babelConfig from '@dword-design/babel-config'
import babelRegister from '@babel/register'
import nodeEnv from 'better-node-env'
import safeRequire from 'safe-require'
import P from 'path'
import { omit } from '@dword-design/functions'

export default function () {

  if (nodeEnv !== 'test') {
    babelRegister(babelConfig)
  }
  
  const projectConfig = {
    title: 'Vue app',
    modules: [],
    ...safeRequire(P.join(this.options.srcDir, 'index.js')) ?? {},
  }

  this.options.head = {
    title: projectConfig.title,
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: projectConfig.title },
    ],
  }

  projectConfig.modules.forEach(module => this.addModule(module))
  
  Object.assign(this.options, projectConfig |> omit(['modules', 'title']))
}