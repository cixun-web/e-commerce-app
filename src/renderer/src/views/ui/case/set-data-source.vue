<template>
  <div>
    <div class="flex justify-between items-center mb-2">
      <span class="shrink-0">数据源</span>
      <el-select
        v-model="dataSourceId"
        style="width: 180px"
        placeholder="请选择数据源"
        class="ml-auto"
        filterable
        @change="getDataSource"
      >
        <el-option
          v-for="item in dataSourceList"
          :key="item.id"
          :label="item.name"
          :value="item.id"
        />
      </el-select>
    </div>
    <div v-if="!dataSourceDetail">请选择数据源</div>
    <DataSource v-else v-model="dataSourceDetail" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import {
  apiBrowserDataSourceList,
  apiBrowserDataSourceDetail
} from '@renderer/server/browser-data-source'
import { ElMessage } from 'element-plus'
import DataSource from '@renderer/components/ui/data-source.vue'

const dataSourceList = ref([])
const dataSourceId = ref('')
const dataSourceDetail = ref(null)

const getDataSourceList = async () => {
  const res = await apiBrowserDataSourceList({})
  if (res.data.code === 0) {
    dataSourceList.value = res.data.data || []
  }
}

const getDataSource = async () => {
  try {
    const res = await apiBrowserDataSourceDetail({
      id: dataSourceId.value
    })
    if (res.data.code === 0) {
      dataSourceDetail.value = JSON.parse(res?.data?.data?.data_source || '[]')
    }
  } catch (error) {
    ElMessage.error(error.message)
  }
}

const setDataSourceDetail = (detail) => {
  dataSourceDetail.value = detail
}

onMounted(() => {
  getDataSourceList()
})

defineExpose({
  dataSourceDetail,
  setDataSourceDetail
})
</script>
