<template>
  <template v-if="mode === 'dialog'">
    <el-dialog v-model="visible" title="选择文件路径" width="50%" top="40vh">
      <div class="w-full">
        <el-select
          v-model="choicePath"
          placeholder="请选择文件路径"
          class="w-full"
          @change="handleChange"
        >
          <el-option
            v-for="item in paths"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
          <el-option label="选择其他位置" value="other" @click="selectPath" />
          <el-option v-if="isOtherPath" :label="choicePath" :value="choicePath" />
        </el-select>
      </div>
    </el-dialog>
  </template>
  <template v-else>
    <div class="w-full">
      <el-select
        v-model="choicePath"
        placeholder="请选择文件路径"
        class="w-full"
        @change="handleChange"
      >
        <el-option
          v-for="item in paths"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
        <el-option label="选择其他位置" value="other" @click="selectPath" />
        <el-option v-if="isOtherPath" :label="choicePath" :value="choicePath" />
      </el-select>
    </div>
  </template>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  mode: {
    type: String,
    default: 'dialog'
  },
  appName: {
    type: String,
    default: ''
  }
})

// 弹窗类型才需要传
const visible = defineModel('visible', {
  default: () => false,
  type: Boolean
})

const localKey = props.appName + '-choicePath'
const localPath = localStorage.getItem(localKey) || 'downloads'
const choicePath = ref(localPath)

const paths = ref([
  {
    label: '下载目录',
    value: 'downloads'
  },
  {
    label: '视频目录',
    value: 'videos'
  },
  {
    label: '桌面',
    value: 'desktop'
  }
])
const isOtherPath = computed(() => {
  const values = paths.value.map((item) => item.value)
  return !values.includes(choicePath.value)
})

const selectPath = async () => {
  try {
    const result = await window.invoke({
      app: 'sys',
      eventName: 'chooseDir'
    })
    if (result) {
      choicePath.value = result
      localStorage.setItem(localKey, choicePath.value)
    }
  } catch (error) {
    ElMessage.error('选择路径失败' + error)
  }
}

const handleChange = () => {
  if (choicePath.value !== 'other') {
    localStorage.setItem(localKey, choicePath.value)
  }
}
</script>
