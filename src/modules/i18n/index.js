import { map } from '@dword-design/functions'
import packageName from 'depcheck-package-name'
import globby from 'globby'
import nuxtPushPlugins from 'nuxt-push-plugins'
import P from 'path'

export default async function () {
  const localeFiles = await globby('*.json', {
    cwd: P.join(this.options.srcDir, 'i18n'),
  })
  if (localeFiles.length > 0) {
    await this.addModule([
      packageName`@nuxtjs/i18n`,
      {
        detectBrowserLanguage: {
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
        strategy: 'prefix',
        vueI18n: {
          fallbackLocale: 'en',
        },
        ...(process.env.BASE_URL && { baseUrl: process.env.BASE_URL }),
      },
    ])
  }
  nuxtPushPlugins(this, require.resolve('./plugin'))
}
