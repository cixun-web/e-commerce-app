<template>
  <div class="flex justify-between items-center mb-2">
    <span>操作步骤</span>
    <el-link type="primary" @click="handleAdd">新增</el-link>
  </div>
  <div class="flex-1 overflow-auto">
    <div class="flex flex-wrap gap-4 p-4">
      <div v-for="(item, index) in steps" :key="index" class="flex">
        <div
          class="relative flex flex-col items-center justify-center px-3 py-6 border rounded-lg min-w-[160px] transition-all duration-300 shadow-sm group"
          :class="[
            item.status === 'loading'
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : item.status === 'success'
                ? 'border-green-500 bg-green-50 text-green-700'
                : item.status === 'error' || item.errTip
                  ? 'border-red-500 bg-red-50 text-red-700'
                  : 'border-gray-300 bg-white text-gray-600 hover:border-blue-300'
          ]"
        >
          <div class="text-sm font-bold mb-1">{{ index + 1 }}. {{ item.name }}</div>
          <el-tooltip v-if="item.errTip" :content="item.errTip" placement="top">
            <el-icon class="text-red-500 mt-1 cursor-pointer"><Warning /></el-icon>
          </el-tooltip>

          <!-- 操作按钮 -->
          <div class="absolute -top-4 -right-4 hidden group-hover:flex gap-1">
            <!-- 运行按钮 -->
            <div
              class="px-3 py-1 bg-green-500 text-white rounded-md cursor-pointer hover:bg-green-600 shadow-sm"
              @click.stop="runTest([item])"
            >
              <el-icon :size="14"><VideoPlay /></el-icon>
            </div>
            <!-- 编辑按钮 -->
            <div
              class="px-3 py-1 bg-blue-500 text-white rounded-md cursor-pointer hover:bg-blue-600 shadow-sm"
              @click.stop="handleEdit(index, item)"
            >
              <el-icon :size="12"><Edit /></el-icon>
            </div>
            <!-- 删除按钮 -->
            <div
              class="px-3 py-1 bg-red-500 text-white rounded-md cursor-pointer hover:bg-red-600 shadow-sm"
              @click.stop="handleDelete(index)"
            >
              <el-icon :size="12"><Delete /></el-icon>
            </div>
          </div>
        </div>
        <div v-if="index < steps.length - 1" class="flex items-center justify-center text-gray-400">
          <el-icon :size="20"><Right /></el-icon>
        </div>
      </div>
    </div>
  </div>
  <el-dialog v-model="dialogVisible" title="步骤选择" width="400px">
    <div class="flex flex-col gap-2">
      <el-select
        v-model="selectedTemplateId"
        placeholder="请选择步骤模板"
        filterable
        class="w-full"
      >
        <el-option
          v-for="item in templateOptions"
          :key="item.id"
          :label="item.name"
          :value="item.id"
        />
      </el-select>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleConfirmAdd">确定</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import { apiBrowserTemplateList } from '@renderer/server/browser-template'
import dayjs from 'dayjs'
import { clone } from '@renderer/utils'

const props = defineProps({
  caseId: {
    type: Number,
    default: -1
  },
  dataSource: {
    type: Object,
    default: () => ({})
  }
})

const steps = ref([])
// 选择步骤弹窗
const dialogVisible = ref(false)
// 选择的步骤模板ID
const selectedTemplateId = ref('')
// 选择的步骤模板索引
const selectedTemplateIndex = ref(-1)
// 步骤模板选项
const templateOptions = ref([])

// 设置数据源
const setSteps = (val) => {
  steps.value = val.map((item, index) => ({
    uid: '' + props.caseId + item.id + index,
    ...item
  }))
  console.log(steps.value, 999)
}

// 获取步骤结果
const getSteps = () => {
  return steps.value.map((item) => ({
    id: item.id,
    name: item.name
  }))
}

const runTest = async (_steps) => {
  // 移除所有节点的 status 和 errTip
  steps.value.forEach((item) => {
    item.status = ''
    item.errTip = ''
  })
  return await window.invoke({
    app: 'ui',
    eventName: 'runCase',
    e2e: {
      data_source: clone(props.dataSource),
      steps: clone(_steps || steps.value)
    }
  })
}

const getTemplatesList = async () => {
  try {
    const res = await apiBrowserTemplateList({})
    return res?.data?.data || []
  } catch {
    return []
  }
}

// 点击新增步骤
const handleAdd = async () => {
  selectedTemplateId.value = ''
  selectedTemplateIndex.value = -1
  templateOptions.value = await getTemplatesList()
  dialogVisible.value = true
}

/**
 * 编辑步骤
 * @param {number} index 步骤索引
 * @param {Object} item 步骤数据
 */
const handleEdit = async (index, item) => {
  selectedTemplateId.value = item.id
  selectedTemplateIndex.value = index
  templateOptions.value = await getTemplatesList()
  dialogVisible.value = true
}

/**
 * 删除步骤
 * @param {number} index 步骤索引
 */
const handleDelete = (index) => {
  steps.value.splice(index, 1)
}

const handleConfirmAdd = () => {
  if (!selectedTemplateId.value) {
    ElMessage.warning('请选择步骤模板')
    return
  }
  const template = templateOptions.value.find((item) => item.id === selectedTemplateId.value)
  if (template) {
    const item = {
      uid: String(props.caseId + template.id + dayjs().unix()),
      id: template.id,
      name: template.name
    }
    if (selectedTemplateIndex.value === -1) {
      steps.value.push(item)
    } else {
      steps.value[selectedTemplateIndex.value] = item
    }
  }
  dialogVisible.value = false
}

/**
 * 监听测试进度回调
 * @param {Object} event 事件对象
 * @param {Object} data 进度数据，包含 stepId, status, errTip
 */
const onProgress = (event, data) => {
  const { stepId, status, errTip } = data
  const step = steps.value.find((item) => item.uid === stepId)
  if (step) {
    step.status = status
    if (errTip) {
      step.errTip = errTip
    }
  }
}

// 监听 run 发送 send 回调
onMounted(() => {
  window.electron?.ipcRenderer?.on('e2e-progress', onProgress)
})
onBeforeUnmount(() => {
  window.electron?.ipcRenderer?.removeListener('e2e-progress', onProgress)
})

defineExpose({
  setSteps,
  getSteps,
  runTest
})
</script>
