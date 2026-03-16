import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiPermissionList } from '@renderer/server/permission'

export const usePermissionStore = defineStore(
  'permission',
  () => {
    const list = ref([])
    const cascadeList = ref([])

    const $getPermissionList = async () => {
      const res = await apiPermissionList({})
      if (res.data.code === 0) {
        const data = res.data.data || {}
        list.value = data.list
        cascadeList.value = data.cascadeList || []
        return {
          status: true,
          message: '登录成功'
        }
      } else {
        list.value = []
        cascadeList.value = []
        return {
          status: false,
          message: res.data.message || '网络异常'
        }
      }
    }
    return {
      list,
      cascadeList,
      $getPermissionList
    }
  },
  {
    persist: true
  }
)
