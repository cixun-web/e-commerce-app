<template>
  <div class="video-preview">
    <div class="video-preview-container">
      <VueDraggable
        v-if="videoList.length > 0"
        v-model="videoList"
        class="video-list"
        :options="{
          animation: 150,
          handle: '.video-list-item',
          ghostClass: 'ghost'
        }"
      >
        <VideoCard
          v-for="video in videoList"
          :key="video.id"
          :video="video"
          class="video-list-item"
          @delete="deleteUrl"
        />
      </VueDraggable>
      <!--  空白上传区域    -->
      <el-upload
        v-else
        class="upload-area"
        drag
        action="#"
        multiple
        :auto-upload="false"
        :show-file-list="false"
        accept="video/*"
        @change="uploadList"
      >
        <div>
          <p class="el-upload__text">拖拽视频文件到这里</p>
          <el-button type="primary">点击上传</el-button>
        </div>
      </el-upload>
    </div>
    <div class="video-preview-footer">
      <div class="actions">
        <el-tooltip v-if="isAction" content="设置">
          <div class="actions-item" @click="filePathShow = true">
            <el-icon><Tools /></el-icon>
          </div>
        </el-tooltip>
        <el-tooltip content="添加视频">
          <el-upload
            action="#"
            multiple
            :auto-upload="false"
            :show-file-list="false"
            accept="video/*"
            @change="uploadList"
          >
            <div class="actions-item">
              <el-icon><CirclePlusFilled /></el-icon>
            </div>
          </el-upload>
        </el-tooltip>
        <el-tooltip content="清空视频">
          <div class="actions-item" @click="clearAll">
            <el-icon><DeleteFilled /></el-icon>
          </div>
        </el-tooltip>
      </div>
      <div v-if="isAction">
        <el-button type="primary" @click="handleStart">开始处理</el-button>
      </div>
    </div>
    <FilePathDialog ref="filePathDialogRef" v-model="filePathShow" app-name="video-deal" />
  </div>
</template>

<script setup>
import { onBeforeUnmount, ref } from 'vue'
import VideoCard from '@renderer/components/VideoCard.vue'
import FilePathDialog from '@renderer/components/FilePathDialog.vue'
import { VueDraggable } from 'vue-draggable-plus'

defineProps({
  isAction: {
    type: Boolean,
    default: false
  }
})
const emits = defineEmits(['start'])

const videoList = ref([])
const filePathShow = ref(false)

// 上传视频文件发生变化时触发
const uploadList = async (uploadFile) => {
  const file = uploadFile.raw
  if (!file) return
  const blobURL = URL.createObjectURL(file)
  const { duration, durationSec, width, height } = await getVideoMeta(file)
  console.log(file, 'uploadList')
  videoList.value.push({
    url: blobURL,
    name: file.name,
    size: file.size,
    raw: file,
    duration,
    durationSec,
    width,
    height
  })
}

// 删除视频文件时触发
const deleteUrl = (_video) => {
  const _url = _video.url
  const index = videoList.value.findIndex((video) => video.url === _url)
  if (index !== -1) {
    videoList.value.splice(index, 1)
    revokeIfNeed(_url)
  }
}

// 清空所有视频文件
const clearAll = () => {
  videoList.value.forEach((video) => {
    revokeIfNeed(video.url)
  })
  videoList.value = []
}

// 格式化视频时长为 HH:MM:SS 格式
const formatTime = (sec) => {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = Math.floor(sec % 60)
  return [h, m, s].map((v) => v.toString().padStart(2, '0')).join(':')
}

// 获取视频元数据
const getVideoMeta = async (file) => {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.src = url

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url)
      resolve({
        duration: formatTime(video.duration),
        durationSec: video.duration,
        width: video.videoWidth,
        height: video.videoHeight
      })
    }
    video.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('读取视频元数据失败'))
    }
  })
}

// 释放内存
const revokeIfNeed = (blobURL) => {
  if (blobURL) {
    URL.revokeObjectURL(blobURL)
  }
}

// 开始处理视频
const handleStart = () => {
  emits('start', videoList.value)
}

onBeforeUnmount(() => {
  if (videoList.value.length > 0) {
    videoList.value.forEach((video) => {
      revokeIfNeed(video.url)
    })
  }
})

defineExpose({
  videoList
})
</script>

<style lang="less" scoped>
.video-preview {
  background-color: #f5f5f5;
  height: 100vh;
  width: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;
  &-container {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 0;
    .video-list {
      height: 100%;
      width: 100%;
      box-sizing: border-box;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      overflow: auto;
    }
    // 删除区域
    .upload-area {
      .el-upload__text {
        margin-bottom: 8px;
      }
      :deep(.el-upload-dragger) {
        background: transparent;
        padding: 32px 28px;
      }
    }
  }
  // 下方操作区域
  &-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 20px 12px 8px;
    .actions {
      display: flex;
      gap: 12px;
      &-item {
        // 宽度和高度一致
        @px: 32px;
        width: @px;
        height: @px;
        color: #303133;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        &:hover {
          background-color: #fff;
        }
      }
    }
  }
}
</style>
