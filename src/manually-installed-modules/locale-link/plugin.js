import { defineNuxtPlugin } from '#imports';

import Component from './component.vue';

export default defineNuxtPlugin(nuxtApp =>
  nuxtApp.vueApp.component('NuxtLocaleLink', Component),
);
