<template>
  <el-drawer v-model="drawerVisible" size="85%" title="流程设计" destroy-on-close>
    <div class="px-4 flex flex-col h-full">
      <el-input v-model="name" placeholder="请输入分组名称" class="mb-2" />
      <div class="flex justify-end mb-2">
        <el-link type="primary" @click="handleAddCase">新增流程</el-link>
      </div>
      <el-scrollbar class="flex-1 pb-3">
        <CaseItem
          v-for="(caseItem, index) in caseList"
          :key="caseItem.uid"
          v-model="caseList[index]"
          @delete="handleDelete"
        />
      </el-scrollbar>
      <div class="flex justify-end">
        <el-button type="primary" @click="saveGroup">保存</el-button>
      </div>
    </div>
    <el-dialog v-model="dialogVisible" title="流程" width="400px">
      <div class="flex flex-col gap-2">
        <el-select v-model="selectedCaseId" placeholder="请选择流程" filterable class="w-full">
          <el-option
            v-for="item in caseOptions"
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
  </el-drawer>
</template>

<script setup>
import { ref } from 'vue'
import { apiBrowserCaseList, apiBrowserCaseDetail } from '@renderer/server/browser-case'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import CaseItem from './item.vue'

const drawerVisible = defineModel({
  default: false,
  type: Boolean
})

const emits = defineEmits(['confirm'])

const groupId = ref(-1)
const name = ref('')
const dialogVisible = ref(false)
const caseOptions = ref([])
const selectedCaseId = ref(null)
const caseList = ref([])

/**
 * 获取分组详情
 * @param {string} id - 分组ID
 */
const getGroupDetail = (id) => {
  groupId.value = id
  if (groupId.value === -1) {
    name.value = ''
    selectedCaseId.value = null
    caseList.value = []
    return
  }
  const localGroupList = JSON.parse(localStorage.getItem('ui-group-list') || '[]')
  const group = localGroupList.find((item) => item.id === id) || {}
  name.value = group.name || ''
  caseList.value =
    group.cases?.map((item) => ({
      ...item,
      data_source: JSON.parse(item.data_source || '[]'),
      steps: JSON.parse(item.steps || '[]')
    })) || []
}

const getCaseList = async () => {
  try {
    const res = await apiBrowserCaseList({})
    if (res.data.code === 0) {
      caseOptions.value = res.data.data || []
    }
    caseOptions.value = caseOptions.value.filter((item) => item.category !== 'luge')
  } catch (error) {
    console.error(error)
  }
}

const getCaseDetail = async () => {
  try {
    const res = await apiBrowserCaseDetail({ id: selectedCaseId.value })
    if (res.data.code === 0) {
      const data = res.data.data || {}
      data.uid = dayjs().unix()
      return data
    }
  } catch (error) {
    console.error(error)
  }
}

const handleAddCase = async () => {
  selectedCaseId.value = null
  await getCaseList()
  dialogVisible.value = true
}

const handleConfirmAdd = async () => {
  if (!selectedCaseId.value) {
    ElMessage.warning('请选择流程')
    return
  }
  const caseDetail = await getCaseDetail()
  if (caseDetail) {
    caseDetail.uid = dayjs().unix()
    caseDetail.name = caseDetail.name || ''
    caseDetail.data_source = JSON.parse(caseDetail.data_source || '[]')
    caseDetail.steps = JSON.parse(caseDetail.steps || '[]')
    caseDetail.isDisabled = false
    caseList.value.push(caseDetail)
    dialogVisible.value = false
  }
}

const handleDelete = (uid) => {
  caseList.value = caseList.value.filter((item) => item.uid !== uid)
}

const saveGroup = () => {
  if (!name.value) {
    ElMessage.warning('请输入分组名称')
    return
  }
  if (!caseList.value.length) {
    ElMessage.warning('请添加流程')
    return
  }
  const group = {
    id: groupId.value,
    name: name.value,
    cases: caseList.value.map((item) => {
      return {
        ...item,
        data_source: JSON.stringify(item.data_source || []),
        steps: JSON.stringify(item.steps || [])
      }
    })
  }
  emits('confirm', group)
}

defineExpose({
  getGroupDetail
})
</script>
