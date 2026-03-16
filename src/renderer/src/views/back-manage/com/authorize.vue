<template>
  <el-dialog v-model="dialogVisible" title="授权权限" width="500px">
    <el-form label-width="100px">
      <el-form-item label="开启权限">
        <el-select v-model="curPermission" multiple filterable>
          <el-option
            v-for="item in permissionStore.cascadeList"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button type="primary" @click="submitForm">确定</el-button>
      <el-button @click="dialogVisible = false">取消</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { apiUpdatePermissionUser } from '@renderer/server/user'
import { usePermissionStore } from '@renderer/store/permission'
import { useUserStore } from '@renderer/store/user'

const dialogVisible = defineModel({
  default: false,
  type: Boolean
})

const emits = defineEmits(['success'])

const curPermission = ref([])
const curUser = ref({})

const permissionStore = usePermissionStore()
const userStore = useUserStore()

const setPermission = (user) => {
  curPermission.value = (user.permission?.split(',') || []).map(Number)
  curUser.value = user
}

// 修改权限
const submitForm = () => {
  apiUpdatePermissionUser({
    permission: curPermission.value.join(','),
    name: curUser.value.name,
    optRole: userStore.role
  }).then((res) => {
    if (res.data.code === 0) {
      ElMessage.success('授权权限成功')
      dialogVisible.value = false
      emits('success')
    } else {
      ElMessage.error(res.data.message || '授权权限失败')
    }
  })
}

defineExpose({
  setPermission
})
</script>
