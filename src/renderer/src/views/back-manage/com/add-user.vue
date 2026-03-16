<template>
  <el-dialog v-model="dialogVisible" title="新增用户" width="500px">
    <el-form ref="formRef" :model="form" label-width="100px">
      <el-form-item v-if="!oldPassword" label="用户名" prop="name" required>
        <el-input v-model="form.name" autocomplete="off" />
      </el-form-item>
      <el-form-item label="密码" prop="password" required>
        <el-input v-model="form.password" type="text" autocomplete="off" />
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
import { apiRegister, apiUpdatePasswordUser } from '@renderer/server/user'
import { randomUid } from '@renderer/utils/index.js'

const dialogVisible = defineModel({
  default: false,
  type: Boolean
})

const emits = defineEmits(['success'])

const form = ref({})
const oldPassword = ref('')

const setUser = (user) => {
  const pwd = randomUid()
  oldPassword.value = user.password || ''
  form.value = {
    name: user.name || '',
    password: user.password || pwd,
    role: user.role || 'user'
  }
}

const submitForm = () => {
  if (!form.value.name) {
    ElMessage.error('请输入用户名')
    return
  }
  if (!form.value.password) {
    ElMessage.error('请输入密码')
    return
  }
  form.value.rePassword = form.value.password
  if (oldPassword.value) {
    updateUser()
  } else {
    addUser()
  }
}

const addUser = () => {
  // 确认新增用户
  apiRegister(form.value).then((res) => {
    if (res.data.code === 0) {
      ElMessage.success('新增用户成功')
      dialogVisible.value = false
      emits('success')
    } else {
      ElMessage.error(res.data.message || '新增用户失败')
    }
  })
}

const updateUser = () => {
  // 确认新增用户
  apiUpdatePasswordUser({
    ...form.value,
    oldPassword: oldPassword.value
  }).then((res) => {
    if (res.data.code === 0) {
      ElMessage.success('修改用户成功')
      dialogVisible.value = false
      emits('success')
    } else {
      ElMessage.error(res.data.message || '修改用户失败')
    }
  })
}

defineExpose({
  setUser
})
</script>
