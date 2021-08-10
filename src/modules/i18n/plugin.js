import Vue from 'vue'

Vue.use({
  install: vue =>
    vue.mixin({
      head() {
        return this.$nuxtI18nHead({ addSeoAttributes: true })
      },
    }),
})
