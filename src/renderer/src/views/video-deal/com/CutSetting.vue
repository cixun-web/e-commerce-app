<template>
  <el-radio-group v-model="resolution" size="large" class="ratio-group">
    <el-radio-button value="1080×1920">9:16(抖音)</el-radio-button>
    <el-radio-button value="1920×1080">16:9(西瓜视频)</el-radio-button>
    <el-radio-button value="360×480">3:4</el-radio-button>
    <el-radio-button value="480×360">4:3</el-radio-button>
    <el-radio-button value="1920×1920">1:1</el-radio-button>
  </el-radio-group>
</template>

<script setup>
import { ref } from 'vue'

const resolution = ref('1080×1920')

defineExpose({
  resolution
})
</script>

<style scoped lang="less">
.ratio-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-start;
  padding-left: 20px;
  padding-top: 20px;
}
</style>
