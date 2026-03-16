<template>
  <div class="p-5">
    <el-table :data="dataSourceList" class="w-full" max-height="calc(100vh - 100px)">
      <el-table-column prop="name" label="名称" />
      <el-table-column label="操作" width="180">
        <template #default="scope">
          <el-link type="primary" @click="editDataSource(scope.row)">编辑</el-link>
          <el-link type="danger" class="ml-4" @click="deleteDataSource(scope.row)">删除</el-link>
        </template>
      </el-table-column>
    </el-table>
    <div class="mt-5 flex justify-center">
      <el-icon color="#409eff" size="30" class="cursor-pointer" @click="addDataSource">
        <CirclePlus />
      </el-icon>
    </div>
    <Set
      ref="setOptRef"
      v-model="dialogVisible"
      :data-source-list="dataSourceList"
      @confirm="handleConfirm"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Set from './set.vue'
import {
  apiBrowserDataSourceAdd,
  apiBrowserDataSourceUpdate,
  apiBrowserDataSourceList,
  apiBrowserDataSourceDelete
} from '@renderer/server/browser-data-source'
import { ElMessage, ElMessageBox } from 'element-plus'

const dataSourceList = ref([])
const dialogVisible = ref(false)
const setOptRef = ref(null)
const optType = ref('add')

const addDataSource = () => {
  setOptRef.value.getDataSourceDetail()
  optType.value = 'add'
  dialogVisible.value = true
}

const handleConfirm = async (step) => {
  if (optType.value === 'add') {
    try {
      await apiBrowserDataSourceAdd(step)
      ElMessage.success('添加成功')
      getDataSourceList()
      dialogVisible.value = false
    } catch (error) {
      ElMessage.error(error.message || '添加数据源失败')
    }
  } else {
    try {
      await apiBrowserDataSourceUpdate(step)
      ElMessage.success('更新成功')
      getDataSourceList()
      dialogVisible.value = false
    } catch (error) {
      ElMessage.error(error.message || '更新数据源失败')
    }
  }
}

const editDataSource = async (dataSource) => {
  setOptRef.value.getDataSourceDetail(dataSource.id)
  optType.value = 'edit'
  dialogVisible.value = true
}

const deleteDataSource = async (dataSource) => {
  ElMessageBox.confirm('确认删除该数据源吗？', '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await apiBrowserDataSourceDelete({ id: dataSource.id })
      ElMessage.success('删除成功')
      getDataSourceList()
    } catch (error) {
      ElMessage.error(error.message || '删除数据源失败')
    }
  })
}

const getDataSourceList = async () => {
  try {
    const res = await apiBrowserDataSourceList({})
    if (res.data.code === 0) {
      dataSourceList.value = res.data.data || []
    }
  } catch (error) {
    ElMessage.error(error.message || '获取数据源列表失败')
  }
}
getDataSourceList()
</script>
