import { defineNuxtPlugin, useHead, useRuntimeConfig } from '#imports'

export default defineNuxtPlugin(() => {
  const {
    public: { name, title },
  } = useRuntimeConfig()
  useHead({
    titleTemplate: pageTitle =>
      pageTitle
        ? `${pageTitle} | ${name}`
        : `${name}${title ? `: ${title}` : ''}`,
  })
})
