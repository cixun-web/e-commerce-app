<template>
  <el-drawer v-model="drawerVisible" size="85%" title="用例设计" destroy-on-close>
    <div class="px-4 flex flex-col h-full">
      <el-input v-model="caseName" placeholder="请输入用例名称" class="mb-2" />
      <SetDataSource ref="setDataSourceRef" />
      <SetSteps
        ref="setStepsRef"
        :case-id="caseId"
        :data-source="setDataSourceRef?.dataSourceDetail"
      />
      <div class="flex justify-end">
        <el-button type="primary" @click="runTest">运行</el-button>
        <el-button type="primary" @click="saveCase">保存</el-button>
      </div>
    </div>
  </el-drawer>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import SetDataSource from './set-data-source.vue'
import SetSteps from './set-steps.vue'
import { apiBrowserCaseDetail } from '@renderer/server/browser-case'

const drawerVisible = defineModel({
  default: false,
  type: Boolean
})

const emits = defineEmits(['confirm'])

const setStepsRef = ref(null)
const setDataSourceRef = ref(null)
const caseName = ref('')
const caseId = ref(-1)

const getCaseDetail = async (id) => {
  caseId.value = id
  if (id === -1) {
    caseName.value = ''
    setDataSourceRef.value.setDataSourceDetail([])
    setStepsRef.value.setSteps([])
    return
  }
  try {
    const res = await apiBrowserCaseDetail({ id })
    if (res.data.code === 0) {
      const data = res.data.data || {}
      caseName.value = data.name || ''
      setDataSourceRef.value.setDataSourceDetail(JSON.parse(data.data_source || '[]'))
      setStepsRef.value.setSteps(JSON.parse(data.steps || '[]'))
    }
  } catch (error) {
    console.error(error)
  }
}

const runTest = async () => {
  try {
    await setStepsRef.value.runTest()
  } catch (error) {
    ElMessage.error(error.message)
  }
}

const saveCase = async () => {
  if (!setDataSourceRef.value.dataSourceDetail) {
    ElMessage.error('请选择数据源')
    return
  }
  emits('confirm', {
    id: caseId.value,
    name: caseName.value,
    data_source: JSON.stringify(setDataSourceRef.value.dataSourceDetail),
    steps: JSON.stringify(setStepsRef.value.getSteps())
  })
}

defineExpose({
  getCaseDetail
})
</script>
