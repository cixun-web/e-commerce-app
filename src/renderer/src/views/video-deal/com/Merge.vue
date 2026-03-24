<template>
  <el-switch v-model="merge" active-value="true" inactive-value="false" active-text="组合" inactive-text="唯一" />
</template>

<script setup>
import { ref } from 'vue'

const merge = ref(false)

defineExpose({
  merge
})
</script>