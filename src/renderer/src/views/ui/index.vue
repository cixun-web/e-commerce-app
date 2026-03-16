<template>
  <div class="flex h-full">
    <el-menu class="min-w-[160px]" :default-active="curMenu">
      <el-menu-item v-for="menu in menus" :key="menu" :index="menu" @click="curMenu = menu">
        {{ menu }}
      </el-menu-item>
    </el-menu>
    <div class="flex-1 w-1">
      <Test v-if="curMenu === '模板配置'"></Test>
      <DataSource v-if="curMenu === '数据源配置'"></DataSource>
      <Case v-if="curMenu === '用例组配置'"></Case>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Test from './test/index.vue'
import DataSource from './data-source/index.vue'
import Case from './case/index.vue'

const menus = ref(['模板配置', '数据源配置', '用例组配置'])
const curMenu = ref('模板配置')
</script>
