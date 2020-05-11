import { parse } from '@babel/core'
import { parseComponent } from 'vue-template-compiler'
import { readFile } from 'fs-extra'
import babelConfig from '@dword-design/babel-config'

export default async filename => {
  const content = await readFile(filename, 'utf8')
  const parsed = parseComponent(content)
  if (!parsed.script) {
    return []
  }
  return parse(parsed.script.content, babelConfig)
}
