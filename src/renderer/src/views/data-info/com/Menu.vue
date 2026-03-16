<template>
  <el-menu
    :default-active="activeIndex"
    class="data-info-menu"
    :default-openeds="['xhs']"
    @select="handleSelect"
  >
    <template v-for="(menu, index) in menus">
      <el-menu-item
        v-if="!menu.children || menu.children.length === 0"
        :key="menu.value"
        :index="menu.value"
      >
        {{ menu.name }}
      </el-menu-item>
      <el-sub-menu v-else :key="menu.value + index + ''" :index="menu.value">
        <template #title>{{ menu.name }}</template>
        <el-menu-item v-for="item in menu.children" :key="item.value" :index="item.value">
          {{ item.name }}
        </el-menu-item>
      </el-sub-menu>
    </template>
  </el-menu>
</template>

<script setup>
import { ref } from 'vue'

const emit = defineEmits(['change'])

const activeIndex = defineModel({
  default: 'bdyx-dp-data',
  type: String
})
const menus = ref([
  // {
  //   name: '小h书',
  //   value: 'xhs',
  //   children: [
  //     {
  //       name: '店铺数据',
  //       value: 'xhs-dp-data'
  //     },
  //     {
  //       name: '商品数据',
  //       value: 'xhs-goods-data'
  //     }
  //   ]
  // },
  {
    name: '百度优选',
    value: 'bdyx',
    children: [
      {
        name: '店铺数据',
        value: 'bdyx-dp-data'
      },
      {
        name: '商品数据',
        value: 'bdyx-goods-data'
      }
    ]
  }
])
const handleSelect = (value) => {
  if (value === activeIndex.value) {
    return
  }
  activeIndex.value = value
  emit('change', value)
}
</script>

<style lang="less" scoped>
.data-info-menu {
  width: 150px;
}
</style>
