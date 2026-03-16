<template>
  <div class="data-info-container" :key="activeMenu">
    <Dp v-if="activeMenu.includes('dp')" :platform="platform" />
    <Goods v-else-if="activeMenu.includes('goods')" :platform="platform" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import Dp from './Dp.vue'
import Goods from './Goods.vue'

const props = defineProps({
  activeMenu: {
    type: String,
    default: 'xhs-shop-data'
  }
})

const platform = computed(() => {
  if (props.activeMenu.includes('xhs')) {
    return 'xhs'
  } else if (props.activeMenu.includes('bdyx')) {
    return 'bdyx'
  }
  return ''
})
</script>

<style lang="less">
.data-info-container {
  padding: 20px;
  box-sizing: border-box;
  flex: 1;
  width: 0;
}
</style>
