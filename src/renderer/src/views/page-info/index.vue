<template>
  <div class="p-5">
    <div>
      <el-button type="primary" @click="openBrowser">打开浏览器</el-button>
      <el-button type="primary" @click="openLog">打开日志</el-button>
    </div>
    <el-table :data="groupList" class="w-full" max-height="calc(100vh - 140px)">
      <el-table-column prop="name" label="用例组名称" />
      <el-table-column label="操作" width="280">
        <template #default="scope">
          <el-link type="primary" :disabled="scope.$index === 0" @click="moveUp(scope.$index)">
            上移
          </el-link>
          <el-link
            type="primary"
            class="ml-2"
            :disabled="scope.$index === groupList.length - 1"
            @click="moveDown(scope.$index)"
          >
            下移
          </el-link>
          <el-link type="danger" class="ml-2" @click="deleteCase(scope.row)">删除</el-link>
          <el-link type="primary" class="ml-2" @click="editGroup(scope.row)">编辑</el-link>
          <el-link type="primary" class="ml-2" @click="copyGroup(scope.row)">复制</el-link>
          <el-link type="primary" class="ml-2" @click="runGroup(scope.row)">运行</el-link>
        </template>
      </el-table-column>
    </el-table>
    <div class="mt-5 flex justify-center">
      <el-icon color="#409eff" size="30" class="cursor-pointer" @click="addGroup">
        <CirclePlus />
      </el-icon>
    </div>
    <SetGroup ref="setGroupRef" v-model="dialogVisible" @confirm="handleConfirm" />
    <el-dialog v-model="logDialogVisible" width="80%">
      <template #header>
        <div class="flex justify-between items-center mr-5">
          <span class="text-lg">日志</span>
          <el-button type="primary" size="small" @click="clearLog">清空日志</el-button>
        </div>
      </template>
      <div class="overflow-auto">
        <div v-for="(item, index) in logList" :key="index" class="mb-2">
          <el-tag :type="item.level">{{ item.message }}</el-tag>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, watch, onBeforeUnmount } from 'vue'
import SetGroup from './set.vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { clone, getUid } from '@renderer/utils'

const dialogVisible = ref(false)
const setGroupRef = ref(null)
const groupList = ref(JSON.parse(localStorage.getItem('ui-group-list') || '[]'))
const logDialogVisible = ref(false)
const logList = ref([])

let logInterval = null

const updateLogList = () => {
  logList.value = JSON.parse(sessionStorage.getItem('e2e-logs') || '[]')
}

watch(logDialogVisible, (val) => {
  if (val) {
    updateLogList()
    logInterval = setInterval(updateLogList, 1000)
  } else {
    if (logInterval) {
      clearInterval(logInterval)
      logInterval = null
    }
  }
})

onBeforeUnmount(() => {
  if (logInterval) {
    clearInterval(logInterval)
  }
})

const openLog = () => {
  logDialogVisible.value = true
}

const clearLog = () => {
  sessionStorage.setItem('e2e-logs', '[]')
  updateLogList()
}

const openBrowser = async () => {
  const res = await window.invoke({
    app: 'ui',
    eventName: 'init'
  })
  if (res && res.status === 'failed') {
    ElMessage.error(res.message)
  }
}

const addGroup = () => {
  setGroupRef.value.getGroupDetail(-1)
  dialogVisible.value = true
}

const editGroup = (group) => {
  setGroupRef.value.getGroupDetail(group.id)
  dialogVisible.value = true
}

const moveUp = (index) => {
  if (index > 0) {
    const temp = groupList.value[index]
    groupList.value[index] = groupList.value[index - 1]
    groupList.value[index - 1] = temp
    localStorage.setItem('ui-group-list', JSON.stringify(groupList.value))
  }
}

const moveDown = (index) => {
  if (index < groupList.value.length - 1) {
    const temp = groupList.value[index]
    groupList.value[index] = groupList.value[index + 1]
    groupList.value[index + 1] = temp
    localStorage.setItem('ui-group-list', JSON.stringify(groupList.value))
  }
}

const deleteCase = (group) => {
  ElMessageBox.confirm('确定删除该用例组吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(() => {
      groupList.value = groupList.value.filter((item) => item.id !== group.id)
      localStorage.setItem('ui-group-list', JSON.stringify(groupList.value))
      ElMessage.success('删除成功')
    })
    .catch(() => {
      ElMessage({
        type: 'info',
        message: '已取消删除'
      })
    })
}

const runGroup = async (group) => {
  ElMessage.success(`运行用例组：${group.name}`)
  const res = await window.invoke({
    app: 'ui',
    eventName: 'runGroup',
    group: clone(group)
  })
  if (res && res.status === 'error') {
    ElMessage.error(res.message)
  }
}

const copyGroup = (group) => {
  const defaultName = `${group.name}-副本`
  ElMessageBox.prompt('请输入新用例组名称', '复制用例组', {
    inputValue: defaultName,
    confirmButtonText: '确定',
    cancelButtonText: '取消'
  })
    .then(({ value }) => {
      const newName = (value || '').trim() || defaultName
      const newGroup = clone(group)
      newGroup.id = getUid()
      newGroup.name = newName
      const localGroupList = JSON.parse(localStorage.getItem('ui-group-list') || '[]')
      localGroupList.push(newGroup)
      localStorage.setItem('ui-group-list', JSON.stringify(localGroupList))
      groupList.value = localGroupList
      ElMessage.success('复制成功')
    })
    .catch(() => {
      ElMessage({
        type: 'info',
        message: '已取消复制'
      })
    })
}

const handleConfirm = (group) => {
  const localGroupList = JSON.parse(localStorage.getItem('ui-group-list') || '[]')
  if (group.id === -1) {
    group.id = getUid()
    localGroupList.push(group)
  } else {
    const index = localGroupList.findIndex((item) => item.id === group.id)
    if (index !== -1) {
      localGroupList[index] = group
    }
  }
  localStorage.setItem('ui-group-list', JSON.stringify(localGroupList))
  ElMessage.success('保存成功')
  groupList.value = localGroupList
  dialogVisible.value = false
}
</script>
