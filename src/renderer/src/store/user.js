import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiLogin } from '@renderer/server/user'

export const useUserStore = defineStore(
  'user',
  () => {
    const name = ref('')
    const password = ref('')
    const role = ref('user')
    const permission = ref([])
    const requestIng = ref(false)
    const isLogin = ref(false)

    const $getLogin = async (_name, _password) => {
      try {
        requestIng.value = true
        const res = await apiLogin({
          name: _name || name.value,
          password: _password || password.value
        })
        requestIng.value = false
        if (res.data.code === 0) {
          const data = res.data.data || {}
          name.value = data.name || ''
          password.value = data.password || ''
          role.value = data.role || 'user'
          permission.value = (data.permission && data.permission.split(',')) || []
          isLogin.value = true
          return {
            status: true,
            message: '登录成功'
          }
        } else {
          name.value = ''
          password.value = ''
          role.value = 'user'
          permission.value = []
          isLogin.value = false
          return {
            status: false,
            message: res.data.message || '登录失败'
          }
        }
      } catch (error) {
        requestIng.value = false
        return {
          status: false,
          message: error.message || '登录失败'
        }
      }
    }
    return {
      name,
      password,
      role,
      permission,
      isLogin,
      requestIng,
      $getLogin
    }
  },
  {
    persist: true
  }
)
