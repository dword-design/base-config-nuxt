import { defineNuxtPlugin } from '#app'

import Component from './component.vue'

export default defineNuxtPlugin(nuxtApp =>
  nuxtApp.vueApp.component('NuxtLocaleLink', Component),
)
