<template>
  <div class="search-form-container">
    <el-form class="search-form">
      <slot name="searchForm" :search-form="searchForm"></slot>
    </el-form>
    <div class="search-form-actions">
      <el-button @click="reset">重 置</el-button>
      <el-button type="primary" @click="search">查 询</el-button>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  defaultFormData: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['search'])

const searchForm = defineModel()

const reset = () => {
  searchForm.value = Object.assign({}, props.defaultFormData)
  emit('search')
}

const search = () => {
  emit('search')
}
</script>

<style scoped>
.search-form-container {
  display: flex;
  justify-content: space-between;
}
.search-form {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-gap: 10px;
  flex: 1;
}
.search-form-actions {
  display: flex;
  justify-content: flex-end;
  margin-left: 10px;
}
</style>
