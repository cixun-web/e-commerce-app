<template>
  <div ref="containerRef" class="video-deal">
    <Setting
      ref="settingRef"
      v-loading="dealIng"
      class="video-deal-setting"
      :style="{ flex: '0 0 ' + leftPercent + '%', minWidth: '0' }"
    />
    <div class="video-deal-splitter" @mousedown="onMouseDown"></div>
    <VideoPreview
      ref="videoPreviewRef"
      :style="{ flex: '1 1 0', minWidth: '0' }"
      is-action
      @start="startVideoDeal"
    />
  </div>
</template>

<script setup>
import { ref, onBeforeUnmount, onMounted } from 'vue'
import Setting from './com/Setting.vue'
import VideoPreview from './com/VideoPreview.vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'

const leftPercent = ref(50)
const containerRef = ref(null)
const dragging = ref(false)
const settingRef = ref(null)
const videoPreviewRef = ref(null)
// 处理中
const dealIng = ref(false)
const taskId = ref()

const getFiles = (videoList) => {
  return videoList.map((f) => ({
    name: f.name,
    url: f.url,
    size: f.size,
    path: window.api.getPathForFile(f.raw), // Electron中可以直接获取path
    durationSec: f.durationSec,
    progress: 0,
    status: 'pending', // pending, converting, success, error
    statusText: '等待中'
  }))
}

const startVideoDeal = () => {
  const videoList = videoPreviewRef.value.videoList
  if (videoList.length === 0) {
    ElMessage.error('请先右侧添加视频')
    return
  }
  const files = getFiles(videoList)
  taskId.value = dayjs().unix()
  if (settingRef.value.curMenu === '画面裁剪') {
    const resolution = settingRef.value?.cutSettingRef?.resolution
    if (!resolution) {
      ElMessage.error('请选择分辨率')
      return
    }
    dealIng.value = true
    const payload = {
      rootPath: localStorage.getItem('video-deal-choicePath') || 'downloads',
      resolution,
      files,
      taskId: taskId.value
    }
    // window.electron.ipcRenderer.send('video:start-convert', payload)
    window.invoke({
      app: 'video-deal',
      eventName: 'convert',
      ...payload
    })
  } else if (settingRef.value.curMenu === '视频组合') {
    const videoGroup = settingRef.value?.combineSettingRef?.getVideoList()
    if (videoGroup.length === 0) {
      ElMessage.error('请先添加前置视频')
      return
    }
    const filesGroup = videoGroup.map((f) => getFiles(f))
    ElMessageBox.confirm('确认所有视频尺寸比例统一，该程序不会转变尺寸', '提示', {
      confirmButtonText: '确 定',
      cancelButtonText: '取 消',
      type: 'warning'
    }).then(() => {
      dealIng.value = true
      const payload = {
        rootPath: localStorage.getItem('video-deal-choicePath') || 'downloads',
        files,
        filesGroup,
        taskId: taskId.value
      }
      window.invoke({
        app: 'video-deal',
        eventName: 'combine',
        ...payload
      })
    })
  } else if (settingRef.value.curMenu === '视频合并') {
    ElMessageBox.confirm('确认所有视频尺寸比例统一，该程序不会转变尺寸', '提示', {
      confirmButtonText: '确 定',
      cancelButtonText: '取 消',
      type: 'warning'
    }).then(() => {
      dealIng.value = true
      const payload = {
        rootPath: localStorage.getItem('video-deal-choicePath') || 'downloads',
        files,
        taskId: taskId.value,
        merge: settingRef.value.mergeRef.merge
      }
      window.invoke({
        app: 'video-deal',
        eventName: 'combine',
        ...payload
      })
    })
  } else if (settingRef.value.curMenu === '视频去重') {
    ElMessageBox.confirm('按照视频时长去重，删除不可逆，是否确定删除', '提示', {
      confirmButtonText: '确 定',
      cancelButtonText: '取 消',
      type: 'warning'
    }).then(() => {
      // 建立一个以时长为key的map，值为视频列表
      const durationMap = new Map()
      files.forEach((f) => {
        const duration = f.durationSec
        const size = f.size
        if (durationMap.has(duration + size)) {
          durationMap.get(duration + size).push(f)
        } else {
          durationMap.set(duration + size, [f])
        }
      })
      const deletePathList = Array.from(durationMap.values())
        .filter((v) => v.length > 1)
        .map((v) => {
          v.sort((a, b) => {
            const getScore = (name) => {
              if (name.includes('cj')) return 0
              if (name.includes('dz')) return 1
              if (name.includes('bg')) return 2
              return 3
            }
            const scoreA = getScore(a.name)
            const scoreB = getScore(b.name)
            if (scoreA !== scoreB) return scoreA - scoreB
            const getMax = (name) => {
              const parts = name.split('-').slice(1)
              const toNumber = (s) => {
                const t = s.trim()
                if (t.includes('万')) {
                  const v = parseFloat(t.replace('万', ''))
                  return isNaN(v) ? 0 : v * 10000
                }
                const m = t.match(/\d+(\.\d+)?/)
                return m ? parseFloat(m[0]) : 0
              }
              const nums = parts.map(toNumber).filter((n) => !Number.isNaN(n))
              if (nums.length === 0) return 0
              return Math.max(...nums)
            }
            const maxA = getMax(a.name)
            const maxB = getMax(b.name)
            if (maxA !== maxB) return maxB - maxA
            return a.name.localeCompare(b.name)
          })
          return v
        })
        .flatMap((v) => v.slice(1).map((f) => f.path))
      window.invoke({
        app: 'video-deal',
        eventName: 'deleteVideo',
        pathList: deletePathList,
        taskId: taskId.value
      })
    })
  }
}

const onMouseDown = () => {
  dragging.value = true
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}

const onMouseMove = (e) => {
  if (!dragging.value || !containerRef.value) return
  const rect = containerRef.value.getBoundingClientRect()
  const x = e.clientX - rect.left
  const percent = (x / rect.width) * 100
  const min = 20
  const max = 80
  leftPercent.value = Math.min(Math.max(percent, min), max)
}

const onMouseUp = () => {
  if (!dragging.value) return
  dragging.value = false
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup', onMouseUp)
}

const allComplete = (event, id) => {
  if (id === taskId.value) {
    dealIng.value = false
    ElMessage.success('视频处理完成')
  }
  if (settingRef.value?.curMenu === '视频去重') {
    videoPreviewRef.value.videoList = []
  }
}

onMounted(() => {
  window?.electron?.ipcRenderer?.on('video-deal-complete', allComplete)
})

onBeforeUnmount(() => {
  window?.electron?.ipcRenderer?.removeListener('video-deal-complete', allComplete)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup', onMouseUp)
})
</script>

<style scoped lang="less">
.video-deal {
  display: flex;
  height: 100vh;
  width: 100%;
  background-color: #fff;
  box-sizing: border-box;
  overflow-x: hidden;
}
.video-deal-splitter {
  width: 6px;
  cursor: col-resize;
  background-color: #e5e7eb;
}
.video-deal-splitter:hover {
  background-color: #cbd5e1;
}
</style>
