<template>
  <div class="h-screen flex bg-white">
    <Menu v-model="activeMenu" />
    <Info :active-menu="activeMenu" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Menu from './com/Menu.vue'
import Info from './com/info/index.vue'

const activeMenu = ref('bdyx-dp-data')
</script>
