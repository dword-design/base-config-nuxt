import { endent } from '@dword-design/functions'
import P from 'path'

export default class extends Error {
  constructor(layoutFile) {
    super(
      endent`
        You have to implement $nuxtI18nHead in ${P.join(
          'layouts',
          layoutFile,
        )} like this to make sure that i18n metadata are generated:

        <script>
        export default {
          head () {
            return this.$nuxtI18nHead({ addSeoAttributes: true })
          }
        }
        </script>
      `,
    )
  }
}
