<template>
  <nuxt-link v-bind="$attrs" :to="localePath(to)">
    <slot />
  </nuxt-link>
</template>

<script>
export default {
  props: {
    to: { required: true },
  },
}
</script>