<template>
  <nuxt-link v-bind="$attrs" :to="localePath(to)">
    <slot />
  </nuxt-link>
</template>

<script setup>
import { useLocalePath } from '#imports';

defineProps({ to: { required: true } });
const localePath = useLocalePath();
</script>
