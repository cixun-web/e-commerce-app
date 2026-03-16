<template>
  <div class="p-5 h-full flex flex-col">
    <div class="mb-4">
      <el-button type="primary" :disabled="isDownloading" @click="download">下载</el-button>
    </div>
    <el-scrollbar class="flex-1">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <VideoCard
          v-for="(video, index) in downloadVideoList"
          :key="index"
          :video="video"
          @delete="handleDelete(index)"
        />
      </div>
    </el-scrollbar>
    <el-dialog v-model="dialogVisible" title="确定下载文件" width="50%">
      <el-form label-width="100px">
        <el-form-item label="视频对应列">
          <el-select v-model="formData.videoColumn">
            <el-option v-for="item in headerList" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="命名方式">
          <el-input v-model="formData.naming_way" placeholder="请输入命名方式" />
        </el-form-item>
        <el-form-item label="下载目录">
          <FilePathDialog mode="inline" app-name="download-video" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="confirmDownload">确 定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import { clone } from '@renderer/utils'
import VideoCard from '@renderer/components/VideoCard.vue'
import FilePathDialog from '@renderer/components/FilePathDialog.vue'

const isDownloading = ref(false)
const dialogVisible = ref(false)
const headerList = ref([])
const dataList = ref([])
const downloadVideoList = ref([])
const formData = ref({
  videoColumn: '',
  naming_way: '${数据平台}-${数据类型}-${数据表现}'
})

const handleDelete = (index) => {
  downloadVideoList.value.splice(index, 1)
}

const onVideoInfo = (_event, payload) => {
  const { url, size } = payload
  const video = downloadVideoList.value.find((v) => v.url === url)
  if (video) {
    video.size = size
  }
}

const onVideoComplete = (_event, payload) => {
  const { url, duration, width, height, size } = payload
  const video = downloadVideoList.value.find((v) => v.url === url)
  if (video) {
    if (duration) video.duration = duration
    if (width) video.width = width
    if (height) video.height = height
    if (size) video.size = size
  }
}

onMounted(() => {
  window.electron?.ipcRenderer?.on('video:info', onVideoInfo)
  window.electron?.ipcRenderer?.on('video:complete', onVideoComplete)
})

onBeforeUnmount(() => {
  window.electron?.ipcRenderer?.removeListener('video:info', onVideoInfo)
  window.electron?.ipcRenderer?.removeListener('video:complete', onVideoComplete)
})

const download = async () => {
  // 选取文件
  const filePath = await window.invoke({
    app: 'sys',
    eventName: 'chooseFile'
  })
  if (!filePath) {
    ElMessage.error('请选择文件')
    return
  }
  // 打开文件
  const xlsxRes = await window.invoke({
    app: 'sys',
    eventName: 'parseXlsx',
    filePath
  })
  if (xlsxRes.status !== 'success') {
    ElMessage.error(xlsxRes.message)
    return
  }
  const xlsxData = xlsxRes.data
  if (!xlsxData || xlsxData.length === 0) {
    ElMessage.error('文件内容为空')
    return
  }
  headerList.value = xlsxData[0]
  dataList.value = xlsxData.slice(1)
  if (dataList.value.length === 0) {
    ElMessage.error('文件内容为空')
    return
  }
  if (headerList.value.includes('视频链接')) {
    formData.value.videoColumn = '视频链接'
  } else if (headerList.value.includes('视频地址')) {
    formData.value.videoColumn = '视频地址'
  } else {
    const findIndex = headerList.value.findIndex((item) => item.includes('视频'))
    formData.value.videoColumn = findIndex !== -1 ? headerList.value[findIndex] : ''
  }
  dialogVisible.value = true
}

const confirmDownload = async () => {
  if (!formData.value.videoColumn || !formData.value.naming_way) {
    ElMessage.error('请选择视频对应列和命名方式')
    return
  }
  isDownloading.value = true
  dialogVisible.value = false
  try {
    const res = await window.invoke({
      app: 'download-video',
      eventName: 'download',
      videoColumn: formData.value.videoColumn,
      naming_way: formData.value.naming_way,
      downloadDir: localStorage.getItem('download-video-choicePath') || 'downloads',
      headerList: clone(headerList.value),
      dataList: clone(dataList.value)
    })
    if (Array.isArray(res)) {
      downloadVideoList.value = res
    }
    isDownloading.value = false
  } catch {
    isDownloading.value = false
  }
}
</script>
