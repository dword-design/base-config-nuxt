export default class extends Error {
  constructor() {
    super(
      'You have to implement $nuxtI18nHead in layouts/default.vue to make sure that i18n metadata are generated.'
    )
  }
}
