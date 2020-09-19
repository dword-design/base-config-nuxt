import { map } from '@dword-design/functions'
import getPackageName from 'get-package-name'
import globby from 'globby'
import P from 'path'

export default async function () {
  const localeFiles = await globby('*.json', {
    cwd: P.join(this.options.srcDir, 'i18n'),
  })
  if (localeFiles.length > 0) {
    this.addModule([
      getPackageName(require.resolve('nuxt-i18n')),
      {
        langDir: 'i18n/',
        lazy: true,
        locales:
          localeFiles
          |> map(filename => {
            const code = P.basename(filename, '.json')
            return { code, file: filename, iso: code }
          }),
        seo: true,
        strategy: 'prefix',
        vueI18n: {
          fallbackLocale: 'en',
        },
      },
    ])
  }
}
