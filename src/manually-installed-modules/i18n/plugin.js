import { defineNuxtPlugin, useHead, useLocaleHead } from '#imports';

export default defineNuxtPlugin(() => {
  const i18nHead = useLocaleHead({ addSeoAttributes: true });
  useHead(i18nHead);
});
