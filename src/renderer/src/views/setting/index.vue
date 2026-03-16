<template>
  <div class="setting-container">
    <div class="setting-browser">
      <div class="setting-title">浏览器配置</div>
      <div class="setting-browser-entry">
        <el-button @click="openBrowser">打开浏览器</el-button>
      </div>
      <el-collapse v-model="browserActiveNames">
        <el-collapse-item v-for="item in browserSettings" :key="item.value" :name="item.value">
          <template #title>
            <span class="setting-item-title">{{ item.label }}</span>
          </template>
          <div class="setting-item-content">
            <component :is="item.component" />
          </div>
        </el-collapse-item>
      </el-collapse>
    </div>
  </div>
</template>

<script setup>
import { ref, markRaw } from 'vue'
import { ElMessage } from 'element-plus'
import Plugin from './plugin.vue'
import Cache from './cache.vue'

// 定义设置项列表，包含标签、值和对应的组件
const browserSettings = ref([
  {
    label: '插件',
    value: 'plugin',
    component: markRaw(Plugin)
  },
  {
    label: '缓存',
    value: 'cache',
    component: markRaw(Cache)
  }
])
// 默认全部展开
const browserActiveNames = ref(browserSettings.value.map((item) => item.value))

const openBrowser = async () => {
  const res = await window.invoke({
    app: 'ui',
    eventName: 'init'
  })
  if (res.status === 'failed') {
    ElMessage.error(res.message)
    return
  }
}
</script>

<style scoped lang="less">
.setting-container {
  padding: 20px;
}

.setting-title {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 12px;
}

.setting-browser-entry {
  margin-bottom: 12px;
}

.setting-item-title {
  font-size: 16px;
  font-weight: bold;
}

.setting-item-content {
  padding: 10px 0;
}
</style>
