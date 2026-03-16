<!-- 数据源值配置组件 -->
<template>
  <el-form label-width="120px" class="max-h-[30vh] overflow-y-auto">
    <el-form-item v-for="item in dataSourceDetail" :key="item.label" :label="item.label">
      <el-input v-if="item.type === 'input'" v-model="item.value" :placeholder="item.placeholder" />
      <el-select v-else-if="item.type === 'select'" v-model="item.value" placeholder="请选择参数值">
        <el-option v-for="opt in item.options" :key="opt" :label="opt" :value="opt" />
      </el-select>
      <div v-else>数据源类型设置有误~</div>
      <!-- child 展示 -->
      <template v-if="item['child-' + item.value]">
        <el-form-item
          v-for="child in item['child-' + item.value]"
          :key="child.label"
          :label="child.label"
          class="mt-4"
        >
          <el-input
            v-if="child.type === 'input'"
            v-model="child.value"
            :placeholder="child.placeholder"
          />
          <el-select
            v-else-if="child.type === 'select'"
            v-model="child.value"
            style="width: 150px"
            placeholder="请选择参数值"
          >
            <el-option v-for="opt in child.options" :key="opt" :label="opt" :value="opt" />
          </el-select>
          <div v-else>数据源类型设置有误~</div>
        </el-form-item>
      </template>
    </el-form-item>
  </el-form>
</template>

<script setup>
const dataSourceDetail = defineModel({
  default: () => [],
  type: Array
})
</script>
