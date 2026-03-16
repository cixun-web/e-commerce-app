<template>
  <div class="video-deal-setting">
    <!-- 菜单 -->
    <el-menu class="video-deal-menu" :default-active="curMenu">
      <el-menu-item v-for="menu in menus" :key="menu" :index="menu" @click="curMenu = menu">
        {{ menu }}
      </el-menu-item>
    </el-menu>
    <CutSetting v-show="curMenu === '画面裁剪'" ref="cutSettingRef" />
    <CombineSetting v-show="curMenu === '视频组合'" ref="combineSettingRef" />
    <div v-show="curMenu === '视频合并'" class="pl-2">将右侧多个视频按照顺序合并成一个视频</div>
    <div v-show="curMenu === '视频去重'" class="pl-2">去重视频时长一致的视频</div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import CutSetting from './CutSetting.vue'
import CombineSetting from './CombineSetting.vue'

const curMenu = ref('画面裁剪')
const menus = ref(['画面裁剪', '视频组合', '视频合并', '视频去重'])
const cutSettingRef = ref(null)
const combineSettingRef = ref(null)

defineExpose({
  curMenu,
  cutSettingRef,
  combineSettingRef
})
</script>

<style scoped lang="less">
.video-deal-setting {
  flex: 1;
  display: flex;
}
.video-deal {
  display: flex;
  height: 100vh;
  width: 100vw;
  background-color: #fff;
}
.video-deal-menu {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.video-deal-menu div {
  padding: 10px 20px;
  cursor: pointer;
}
.video-deal-menu div:hover {
  background-color: #e5e5e5;
}
.video-deal-content {
  flex: 1;
}
</style>
