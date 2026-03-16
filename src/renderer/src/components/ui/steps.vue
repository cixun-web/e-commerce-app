<!-- 进度展示组件 -->
<template>
  <div class="flex flex-wrap gap-4 p-4">
    <div v-for="(item, index) in steps" :key="index" class="flex">
      <div
        class="relative flex flex-col items-center justify-center px-3 py-6 border rounded-lg min-w-[160px] transition-all duration-300 shadow-sm group"
        :class="[
          item.status === 'loading'
            ? 'border-blue-500 bg-blue-50 text-blue-700'
            : item.status === 'success'
              ? 'border-green-500 bg-green-50 text-green-700'
              : item.status === 'error' || item.errTip
                ? 'border-red-500 bg-red-50 text-red-700'
                : 'border-gray-300 bg-white text-gray-600 hover:border-blue-300'
        ]"
      >
        <div class="text-sm font-bold mb-1">{{ index + 1 }}. {{ item.name }}</div>
        <el-tooltip v-if="item.errTip" :content="item.errTip" placement="top">
          <el-icon class="text-red-500 mt-1 cursor-pointer"><Warning /></el-icon>
        </el-tooltip>
      </div>
      <slot :name="index" />
      <div v-if="index < steps.length - 1" class="flex items-center justify-center text-gray-400">
        <el-icon :size="20"><Right /></el-icon>
      </div>
    </div>
  </div>
</template>

<script setup>
const steps = defineModel({
  default: () => [],
  type: Array
})
</script>
