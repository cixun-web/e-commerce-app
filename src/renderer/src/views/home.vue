<template>
  <div class="homePage">
    <Login v-if="!userStore.isLogin" />
    <Actions v-else />
  </div>
</template>

<script setup>
import Login from '@renderer/components/Login.vue'
import Actions from '@renderer/views/actions.vue'
import { useUserStore } from '@renderer/store/user'
import { usePermissionStore } from '@renderer/store/permission'

const userStore = useUserStore()
const permissionStore = usePermissionStore()

permissionStore.$getPermissionList()
</script>

<style scoped lang="less">
.homePage {
  padding-top: 15vh;
}
</style>
