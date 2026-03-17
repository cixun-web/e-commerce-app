<template>
  <el-form class="login-form" label-width="90px">
    <el-form-item label="用户名" required>
      <el-input v-model="name" placeholder="请输入用户名" />
    </el-form-item>
    <el-form-item label="密码" required>
      <el-input v-model="password" placeholder="请输入密码" type="password" @keyup.enter.native="login" />
    </el-form-item>
    <el-form-item class="login-footer">
      <el-button type="primary" @click="login"> 登录 </el-button>
    </el-form-item>
  </el-form>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@renderer/store/user'

const userStore = useUserStore()

const name = ref('')
const password = ref('')

const login = async () => {
  if (name.value === '' || password.value === '') {
    ElMessage.error('请输入用户名和密码')
    return
  }
  const result = await userStore.$getLogin(name.value, password.value)
  if (result.status) {
    ElMessage.success('登录成功')
  } else {
    ElMessage.error(result.message || '登录失败')
  }
}
</script>

<style scoped lang="less">
.login-form {
  width: 500px;
  padding: 32px 20px 12px 0;
  box-sizing: border-box;
  border: 1px solid #ccc;
  border-radius: 5px;
  background-color: #fff;
  margin: 0 auto;
  .login-footer {
    /deep/ .el-form-item__content {
      display: flex;
      justify-content: center;
      margin-left: 0 !important;
      gap: 18px;
    }
  }
}
</style>
