<template>
  <div class="p-5">
    <el-table :data="templateList" class="w-full" max-height="calc(100vh - 100px)">
      <el-table-column prop="name" label="名称" />
      <el-table-column label="操作" width="180">
        <template #default="scope">
          <el-link type="primary" @click="editTemplate(scope.row)">编辑</el-link>
          <el-link type="danger" class="ml-4" @click="deleteTemplate(scope.row)">删除</el-link>
        </template>
      </el-table-column>
    </el-table>
    <div class="mt-5 flex justify-center">
      <el-icon color="#409eff" size="30" class="cursor-pointer" @click="addTemplate">
        <CirclePlus />
      </el-icon>
    </div>
    <Set
      ref="setOptRef"
      v-model="dialogVisible"
      :template-list="templateList"
      @confirm="handleConfirm"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Set from './set.vue'
import {
  apiBrowserTemplateList,
  apiBrowserTemplateUpdate,
  apiBrowserTemplateAdd,
  apiBrowserTemplateDelete
} from '@renderer/server/browser-template'
import { ElMessage, ElMessageBox } from 'element-plus'

const templateList = ref([])
const dialogVisible = ref(false)
const setOptRef = ref(null)
const optType = ref('add')

const addTemplate = () => {
  setOptRef.value.getTemplateDetail()
  optType.value = 'add'
  dialogVisible.value = true
}

const handleConfirm = async (step) => {
  if (optType.value === 'add') {
    try {
      await apiBrowserTemplateAdd(step)
      ElMessage.success('添加成功')
      getTemplateList()
      dialogVisible.value = false
    } catch (error) {
      ElMessage.error(error.message || '添加模板失败')
    }
  } else {
    try {
      await apiBrowserTemplateUpdate(step)
      ElMessage.success('更新成功')
      getTemplateList()
      dialogVisible.value = false
    } catch (error) {
      ElMessage.error(error.message || '更新模板失败')
    }
  }
}

const editTemplate = async (template) => {
  setOptRef.value.getTemplateDetail(template.id)
  optType.value = 'edit'
  dialogVisible.value = true
}

const deleteTemplate = async (template) => {
  ElMessageBox.confirm('确认删除该模板吗？', '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await apiBrowserTemplateDelete({ id: template.id })
      ElMessage.success('删除成功')
      getTemplateList()
    } catch (error) {
      ElMessage.error(error.message || '删除模板失败')
    }
  })
}

const getTemplateList = async () => {
  try {
    const res = await apiBrowserTemplateList({})
    if (res.data.code === 0) {
      templateList.value = res.data.data || []
    }
  } catch (error) {
    ElMessage.error(error.message || '获取模板列表失败')
  }
}
getTemplateList()
</script>
