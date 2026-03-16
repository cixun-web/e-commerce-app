<template>
  <div class="video-card">
    <div class="video-card-header">
      <span>{{ video.name }}</span>
      <div class="close-icon">
        <el-icon @click="emit('delete', video)"><Close /></el-icon>
      </div>
    </div>
    <div class="video-card-content">
      <slot name="preview">
        <div class="video-wrapper">
          <video ref="videoRef" class="video-item" preload="metadata" playsinline>
            <source :src="video.url" type="video/mp4" />
          </video>
          <div v-if="progressing" class="progress-overlay">
            <div class="progress-bar" :style="{ width: progress + '%' }"></div>
            <span class="progress-text">{{ Math.round(progress) }}%</span>
          </div>
          <span class="play-overlay">
            <el-icon><VideoPlay /></el-icon>
          </span>
        </div>
      </slot>
      <div>
        <div>大小：{{ video.size ? (video.size / 1024 / 1024).toFixed(2) : '-' }}MB</div>
        <div>时长：{{ video.duration || '-' }}</div>
        <div>尺寸：{{ video.width ? video.width + '×' + video.height : '-' }}</div>
      </div>
      <div v-if="progress >= 100" class="fileIcon" @click="openFile(savePath)">
        <el-icon><Folder /></el-icon>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { VideoPlay, Close, Folder } from '@element-plus/icons-vue'

const props = defineProps({
  video: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['delete'])

const progress = ref(0)
const progressing = ref(false)
const savePath = ref('')
const onProgress = (_event, payload) => {
  const url = payload?.url
  if (url === props.video.url) {
    progress.value = payload?.progress ?? 0
    progressing.value = (progress.value || 0) < 100
  }
}
const onComplete = (_event, payload) => {
  const { url } = payload
  if (url === props.video.url) {
    progress.value = 100
    progressing.value = false
    savePath.value = payload.savePath
  }
}

const openFile = (path) => {
  window.invoke({
    app: 'sys',
    eventName: 'openDirOrFile',
    path
  })
}

onMounted(() => {
  window.electron?.ipcRenderer?.on('video:progress', onProgress)
  window.electron?.ipcRenderer?.on('video:complete', onComplete)
})
onBeforeUnmount(() => {
  window.electron?.ipcRenderer?.removeListener('video:progress', onProgress)
  window.electron?.ipcRenderer?.removeListener('video:complete', onComplete)
})
</script>

<style scoped lang="less">
.video-card {
  background-color: #fff;
  padding: 12px;
  border-radius: 8px;
  &-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    .close-icon {
      cursor: pointer;
    }
  }
  &-content {
    display: flex;
    .video-wrapper {
      position: relative;
      width: 160px;
      height: 120px;
      background-color: #000;
      border-radius: 8px;
      margin-right: 24px;
      .video-item {
        width: 100%;
        height: 100%;
      }
      .progress-overlay {
        position: absolute;
        left: 0;
        bottom: 0;
        width: 100%;
        height: 24px;
        background: rgba(0, 0, 0, 0.5);
        border-radius: 0 0 8px 8px;
        overflow: hidden;
        .progress-bar {
          height: 100%;
          background: #409eff;
        }
        .progress-text {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          color: #fff;
          font-size: 12px;
        }
      }
      .play-overlay {
        @px: 60px;
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        pointer-events: none;
        display: flex;
        align-items: center;
        justify-content: center;
        width: @px;
        height: @px;
        border-radius: 50%;
        font-size: calc(@px / 2);
        background: rgba(0, 0, 0, 0.4);
        color: #fff;
      }
    }
  }
}
.fileIcon {
  display: flex;
  flex: 1;
  justify-content: flex-end;
  align-items: flex-end;
  cursor: pointer;
}
</style>
