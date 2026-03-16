<template>
  <div class="actions">
    <div class="actions-user">
      <el-button type="primary" @click="refresh">刷新</el-button>
    </div>
    <div class="actions-container">
      <el-button
        v-for="action of actions"
        :key="action.value"
        v-fac="action.value"
        type="primary"
        @click="openNewWindow(action)"
      >
        {{ action.title }}
      </el-button>
      <el-button
        v-if="userStore.role === 'cx'"
        type="primary"
        @click="
          openNewWindow({
            path: '/ui',
            title: 'UI配置'
          })
        "
      >
        UI配置
      </el-button>
      <el-button
        v-if="userStore.role === 'cx'"
        type="primary"
        @click="
          openNewWindow({
            path: '/back-manage',
            title: '后台管理'
          })
        "
      >
        后台管理
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { useUserStore } from '@renderer/store/user'
import { ElMessage } from 'element-plus'
import { ref } from 'vue'

const userStore = useUserStore()
const actions = ref([
  {
    path: '/video-deal',
    title: '视频处理',
    value: 2
  },
  {
    path: '/download-video',
    title: '视频下载',
    value: 3
  },
  {
    path: '/page-info',
    title: '页面信息',
    value: 4
  },
  {
    path: '/data-info',
    title: '数据信息',
    value: 5
  },
  {
    path: '/online-table',
    title: '在线表格',
    value: 6
  }
])

/**
 * 打开新窗口
 */
const openNewWindow = (action) => {
  window.invoke({
    app: 'sys',
    eventName: 'openNewWindow',
    routePath: action.path,
    title: action.title
  })
}

const refresh = () => {
  if (userStore.requestIng) {
    ElMessage.error('刷新中，请稍后')
    return
  }
  userStore.$getLogin()
}
</script>

<style scoped lang="less">
.actions {
  &-user {
    display: flex;
    justify-content: flex-end;
    margin: 0 10vw 32px;
  }
  &-container {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    grid-gap: 20px;
    width: 80vw;
    margin: 0 auto;
  }
}
/* 解决 Element Plus 默认 .el-button + .el-button 左边距导致换行首项左侧出现间距 */
.actions :deep(.el-button + .el-button) {
  margin-left: 0;
}
</style>
