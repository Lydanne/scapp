<template>
  <view style="background-color: yellow; width: 200px;">
    C3: {{ props.label }}
  </view>
</template>

<script setup lang="ts">
const props = defineProps({
  label: String
})
</script>

<style scoped>

</style>