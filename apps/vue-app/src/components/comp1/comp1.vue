<template>
  <view style="background-color: #eee; width: 200px;display: flex;">
    LABEL: <slot name="item" :data="props.label" />
  </view>
</template>

<script setup lang="ts">
const props = defineProps({
  label: String
})
</script>

<style scoped>

</style>