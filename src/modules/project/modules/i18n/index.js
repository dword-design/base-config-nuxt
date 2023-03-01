import * as babel from '@babel/core'
import traverse from '@babel/traverse'
import { map, some, uniq } from '@dword-design/functions'
import { installModule } from '@nuxt/kit'
import { parse } from '@vue/compiler-sfc'
import packageName from 'depcheck-package-name'
import fs from 'fs-extra'
import { globby } from 'globby'
import P from 'path'

import MissingNuxtI18nHeadError from './missing-nuxt-i18n-head-error.js'

const checkNuxtI18nHead = async () => {
  const layoutFiles =
    ['default.vue', ...(await globby('*', { cwd: 'layouts', ignore: '-*' }))]
    |> await
    |> uniq

  const checkLayoutFile = async layoutFile => {
    const layout = (await fs.exists(P.join('layouts', layoutFile)))
      ? parse(await fs.readFile(P.join('layouts', layoutFile), 'utf8'))
      : {}
    if (parsed.errors.length > 0) {
      throw new Error(parsed.errors[0])
    }
    if (layout.descriptor.script?.content) {
      const ast = await babel.parse(layout.descriptor.script?.content, {
        filename: 'index.js',
      })
      let valid = false
      traverse.default(ast, {
        ExportDefaultDeclaration: path => {
          if (
            path.node.declaration.properties
            |> some(
              property =>
                property.type === 'ObjectMethod' &&
                property.key?.name === 'head' &&
                property.body.body.length === 1 &&
                property.body.body[0].type === 'ReturnStatement' &&
                property.body.body[0].argument.type === 'CallExpression' &&
                property.body.body[0].argument.callee.type ===
                  'MemberExpression' &&
                property.body.body[0].argument.callee.object.type ===
                  'ThisExpression' &&
                property.body.body[0].argument.callee.property?.name ===
                  '$nuxtI18nHead' &&
                property.body.body[0].argument.arguments.length === 1 &&
                property.body.body[0].argument.arguments[0].type ===
                  'ObjectExpression' &&
                property.body.body[0].argument.arguments[0].properties
                  .length === 1 &&
                property.body.body[0].argument.arguments[0].properties[0].key
                  ?.name === 'addSeoAttributes' &&
                property.body.body[0].argument.arguments[0].properties[0].value
                  ?.value === true
            )
          ) {
            valid = true
          }
        },
      })
      if (valid) {
        return
      }
    }
    throw new MissingNuxtI18nHeadError(layoutFile)
  }

  return Promise.all(layoutFiles |> map(checkLayoutFile))
}

export default async function (moduleOptions, nuxt) {
  const localeFiles = await globby('*.json', {
    cwd: P.join(nuxt.options.srcDir, 'i18n'),
  })
  if (localeFiles.length > 0) {
    await checkNuxtI18nHead()
    await installModule([
      packageName`@nuxtjs/i18n`,
      {
        detectBrowserLanguage:
          localeFiles.length === 1
            ? false
            : {
                fallbackLocale: 'en',
                redirectOn: 'no prefix',
                useCookie: false,
              },
        langDir: 'i18n/',
        lazy: true,
        locales:
          localeFiles
          |> map(filename => {
            const code = P.basename(filename, '.json')

            return { code, file: filename, iso: code }
          }),
        seo: localeFiles.length > 1,
        strategy: localeFiles.length === 1 ? 'no_prefix' : 'prefix',
        ...(localeFiles.length === 1 && {
          defaultLocale: P.basename(localeFiles[0], '.json'),
        }),
        ...(process.env.BASE_URL && { baseUrl: process.env.BASE_URL }),
      },
    ])
  }
}
