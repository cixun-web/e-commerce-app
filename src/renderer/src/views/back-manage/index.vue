<template>
  <div class="back-manage">
    <div class="back-manage-actions">
      <el-button type="primary" @click="optUser">新增用户</el-button>
      <el-button type="primary" @click="addPermissionDialogVisible = true">新增权限</el-button>
    </div>
    <el-table :data="userList" border style="width: 100%" max-height="calc(100vh - 100px)">
      <el-table-column prop="name" label="用户名" />
      <el-table-column prop="password" label="密码" />
      <el-table-column prop="permission" label="权限">
        <template #default="scope">
          {{
            scope.row.permission
              ?.split(',')
              ?.map((id) => permissionName(id))
              ?.join('、') || '—'
          }}
        </template>
      </el-table-column>
      <el-table-column prop="opt" label="操作">
        <template #default="scope">
          <el-link type="primary" class="ml-2" @click="optUser(scope.row)">修改密码</el-link>
          <el-link type="success" class="ml-2" @click="openAuthorizeDialog(scope.row)">
            授权
          </el-link>
        </template>
      </el-table-column>
    </el-table>
    <AddUser ref="addUserRef" v-model="addDialogVisible" @success="$getUserList" />
    <AddPermission v-model="addPermissionDialogVisible" />
    <Authorize ref="authorizeRef" v-model="authorizeDialogVisible" @success="$getUserList" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { apiUserList } from '@renderer/server/user'
import { usePermissionStore } from '@renderer/store/permission'
import AddUser from './com/add-user.vue'
import AddPermission from './com/add-permission.vue'
import Authorize from './com/authorize.vue'
import { useUserStore } from '@renderer/store/user'

const permissionStore = usePermissionStore()
const userStore = useUserStore()
const userList = ref([])
const addDialogVisible = ref(false)
const addPermissionDialogVisible = ref(false)
const authorizeDialogVisible = ref(false)
const addUserRef = ref(null)
const authorizeRef = ref(null)

const optUser = (user = {}) => {
  addUserRef.value.setUser(user)
  addDialogVisible.value = true
}

const $getUserList = async () => {
  const res = await apiUserList({
    optRole: userStore.role,
    page_size: 1000
  })
  if (res.data.code === 0) {
    userList.value = res.data.data.list
  } else {
    userList.value = []
  }
}

const permissionName = (id) => {
  const permission = permissionStore.list.find((item) => item.id === Number(id))
  return permission?.name || ''
}

const openAuthorizeDialog = (user) => {
  authorizeRef.value.setPermission(user)
  authorizeDialogVisible.value = true
}

$getUserList()
</script>

<style lang="less" scoped>
.back-manage {
  height: 100vh;
  width: 100vw;
  box-sizing: border-box;
  padding: 20px;
  background-color: #fff;
  &-actions {
    margin-bottom: 20px;
  }
}
.user-opt {
  display: flex;
  gap: 8px;
}
</style>
