<template>
  <el-button type="danger" @click="clearCache">清空缓存</el-button>
</template>

<script setup>
import { ElMessage } from 'element-plus'

// 缓存相关逻辑
const clearCache = () => {
  window
    .invoke({
      app: 'ui',
      eventName: 'clearCache'
    })
    .then(() => {
      ElMessage.success('缓存已清空')
    })
}
</script>
