import { addComponent, createResolver, defineNuxtModule } from '@nuxt/kit';

const resolver = createResolver(import.meta.url);

export default defineNuxtModule({
  setup: () =>
    addComponent({
      filePath: resolver.resolve('./component.vue'),
      name: 'NuxtLocaleLink',
    }),
});
