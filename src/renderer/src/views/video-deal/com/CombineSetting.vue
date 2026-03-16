<template>
  <div class="w-full h-full flex overflow-x-auto overflow-y-hidden">
    <div
      v-for="group in groupList"
      :key="group.id"
      class="relative flex-1 min-w-[300px] border border-solid border-gray-300"
    >
      <div class="absolute right-2 top-2 flex">
        <el-link type="primary" @click="addGroup">添加</el-link>
        <el-link type="danger" class="ml-2" @click="deleteGroup(group.id)">删除</el-link>
      </div>
      <VideoPreview :ref="(el) => setGroupRef(el, group.id)" class="flex-1" />
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import VideoPreview from './VideoPreview.vue'
import dayjs from 'dayjs'

const groupList = ref([])
const groupRefs = ref(new Map())

const setGroupRef = (el, id) => {
  if (el) {
    groupRefs.value.set(id, el)
  } else {
    groupRefs.value.delete(id)
  }
}

const addGroup = () => {
  groupList.value.push({
    id: dayjs().valueOf()
  })
}

const deleteGroup = (id) => {
  const index = groupList.value.findIndex((group) => group.id === id)
  if (index !== -1) {
    groupList.value.splice(index, 1)
  }
}

const getVideoList = () => {
  const videoGroup = []
  groupList.value.forEach((group) => {
    const el = groupRefs.value.get(group.id)
    if (el && el.videoList && el.videoList.length > 0) {
      videoGroup.push(el.videoList)
    }
  })
  return videoGroup
}

onMounted(() => {
  if (groupList.value.length === 0) {
    addGroup()
  }
})

defineExpose({
  getVideoList
})
</script>
