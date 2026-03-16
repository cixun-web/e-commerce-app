<template>
  <el-dialog v-model="visible" title="模板列表">
    <el-table :data="templates">
      <el-table-column prop="name" label="模板名称" />
      <el-table-column prop="opt" label="操作">
        <template #default="scope">
          <el-link type="danger" @click="deleteTemplate(scope.row)">删 除</el-link>
          <el-link type="primary" class="ml-5" @click="useTemplate(scope.row)">运 行</el-link>
        </template>
      </el-table-column>
    </el-table>
    <el-dialog v-model="useDialogVisiable" title="执行参数">
      <div>需要生成的表</div>
      <el-checkbox-group v-model="checkList">
        <el-checkbox label="筛选表" value="filterForm" disabled />
        <el-checkbox label="总表" value="allForm" />
        <el-checkbox v-if="curRow.mapping.isChecked" label="映射表" value="downForm" />
      </el-checkbox-group>
      <template #footer>
        <el-button type="primary" @click="run">运 行</el-button>
      </template>
    </el-dialog>
  </el-dialog>
</template>

<script setup>
import { watch, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
import { getFilterData, getDownFormData } from './utils'

const visible = defineModel({
  default: false,
  type: Boolean
})
const templates = ref([])
const useDialogVisiable = ref(false)
const checkList = ref(['filterForm'])
const curRow = ref({})

const dataHeaders = ref([])
const dataRows = ref([])

const getLocalTemplates = async () => {
  templates.value = JSON.parse(localStorage.getItem('onlineData_templates') || '[]')
}

const useTemplate = async (row) => {
  const res = await window.invoke({
    app: 'onlineData',
    eventName: 'uploadXlsx'
  })
  if (res?.status === 'success') {
    const { headers = [], rows = [] } = res?.data || {}
    dataHeaders.value = headers
    dataRows.value = rows
    curRow.value = row
    checkList.value = ['filterForm', 'allForm']
    if (row?.mapping?.isChecked) {
      checkList.value.push('downForm')
    }
    useDialogVisiable.value = true
  }
}

const run = async () => {
  ElMessage.success('下载中...')
  useDialogVisiable.value = false
  const works = []
  // 下载过滤表
  const filterRows = getFilterData(dataRows.value, curRow.value.filterForm)
  // 当前时间戳
  const timestamp = dayjs().unix()
  if (checkList.value.includes('filterForm')) {
    works.push(
      window.invoke({
        app: 'onlineData',
        eventName: 'downloadXlsx',
        headers: JSON.parse(JSON.stringify(dataHeaders.value)),
        rows: JSON.parse(JSON.stringify(filterRows)),
        filename: `${curRow.value.name}-筛选表-${timestamp}`
      })
    )
  }
  if (checkList.value.includes('allForm')) {
    works.push(
      window.invoke({
        app: 'onlineData',
        eventName: 'downloadXlsx',
        headers: JSON.parse(JSON.stringify(dataHeaders.value)),
        rows: JSON.parse(JSON.stringify(dataRows.value)),
        filename: `${curRow.value.name}-总表-${timestamp}`
      })
    )
  }
  if (checkList.value.includes('downForm')) {
    const downRows = getDownFormData(filterRows, curRow.value.mapping)
    console.log(curRow.value.mapping, downRows, 9999, dataHeaders.value)
    works.push(
      window.invoke({
        app: 'onlineData',
        eventName: 'downloadXlsx',
        headers: ['数据类型', '数据表现', '视频链接'],
        rows: JSON.parse(JSON.stringify(downRows)),
        filename: `${curRow.value.name}-映射表-${timestamp}`
      })
    )
  }
  await Promise.all(works)
  ElMessage.success('下载完成')
}

const deleteTemplate = (row) => {
  ElMessageBox.confirm('确定删除模板吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    const localTemplates = JSON.parse(localStorage.getItem('onlineData_templates') || '[]')
    const newTemplates = localTemplates.filter((item) => item.name !== row.name)
    localStorage.setItem('onlineData_templates', JSON.stringify(newTemplates))
    ElMessage.success('删除成功')
    init()
  })
}

const init = () => {
  getLocalTemplates()
}

watch(
  () => visible.value,
  (newVal) => {
    if (newVal) {
      init()
    }
  }
)
</script>
