<template>
  <div class="p-5">
    <el-table :data="caseList" class="w-full" max-height="calc(100vh - 100px)">
      <el-table-column prop="name" label="用例名称" />
      <el-table-column label="操作" width="120">
        <template #default="scope">
          <el-link type="primary" @click="editCase(scope.row)">编辑</el-link>
          <el-link type="danger" class="ml-2" @click="deleteCase(scope.row)">删除</el-link>
        </template>
      </el-table-column>
    </el-table>
    <div class="mt-5 flex justify-center">
      <el-icon color="#409eff" size="30" class="cursor-pointer" @click="addCase">
        <CirclePlus />
      </el-icon>
    </div>
    <SetCase ref="setCaseRef" v-model="dialogVisible" @confirm="handleConfirm" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import SetCase from './set.vue'
import { ElMessage } from 'element-plus'
import {
  apiBrowserCaseAdd,
  apiBrowserCaseList,
  apiBrowserCaseUpdate
} from '@renderer/server/browser-case'

const caseList = ref([])
const dialogVisible = ref(false)
const setCaseRef = ref(null)

const addCase = () => {
  setCaseRef.value.getCaseDetail(-1)
  dialogVisible.value = true
}

const editCase = (caseItem) => {
  setCaseRef.value.getCaseDetail(caseItem.id)
  dialogVisible.value = true
}

const deleteCase = () => {}

const handleConfirm = async (val) => {
  if (val.id === -1) {
    try {
      const caseItem = {
        name: val.name,
        data_source: val.data_source,
        steps: val.steps
      }
      await apiBrowserCaseAdd(caseItem)
      ElMessage.success('添加成功')
      getCaseList()
      dialogVisible.value = false
    } catch (error) {
      ElMessage.error(error.message || '添加用例失败')
    }
  } else {
    try {
      await apiBrowserCaseUpdate(val)
      ElMessage.success('更新成功')
      getCaseList()
      dialogVisible.value = false
    } catch (error) {
      ElMessage.error(error.message || '更新用例失败')
    }
  }
}

const getCaseList = async () => {
  try {
    const res = await apiBrowserCaseList({})
    if (res.data.code === 0) {
      caseList.value = res.data.data || []
    }
  } catch (error) {
    ElMessage.error(error.message || '获取用例列表失败')
  }
}
getCaseList()
</script>
