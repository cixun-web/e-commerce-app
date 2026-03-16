<template>
  <div class="goodsPage">
    <SearchForm v-model="curFormData" :default-form-data="defaultFormData" @search="search">
      <template #searchForm="scope">
        <el-form-item label="店铺ID：" prop="dp_id">
          <el-input v-model="scope.searchForm.dp_id"></el-input>
        </el-form-item>
        <el-form-item label="商品标题：" prop="title">
          <el-input v-model="scope.searchForm.title"></el-input>
        </el-form-item>
        <el-form-item label="商品类型：" prop="is_new">
          <el-select v-model="scope.searchForm.is_new" clearable>
            <el-option label="新品" value="1"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="最小销量数：" prop="min_sales">
          <el-input-number v-model="scope.searchForm.min_sales" :min="0"></el-input-number>
        </el-form-item>
        <el-form-item label="最小价格：" prop="min_price">
          <el-input-number v-model="scope.searchForm.min_price" :min="0"></el-input-number>
        </el-form-item>
        <el-radio-group v-model="scope.searchForm.sort" class="sort-radio-group">
          <el-radio value="1">增量降序</el-radio>
          <el-radio value="2">增量升序</el-radio>
          <el-radio value="3">销量降序</el-radio>
          <el-radio value="4">销量升序</el-radio>
        </el-radio-group>
      </template>
    </SearchForm>
    <el-table v-loading="getListIng" :data="goodsList" class="goods-table">
      <el-table-column
        v-for="item in columns"
        :key="item.prop"
        :label="item.label"
        :prop="item.prop"
      >
        <template #default="scope">
          <div @click="copy(scope.row[item.prop])">
            {{ scope.row[item.prop] }}
          </div>
        </template>
      </el-table-column>
      <el-table-column label="操作">
        <template #default="scope">
          <el-link type="primary" @click="toDetail(scope.row)">详情</el-link>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination
      :total="total"
      :page-size="10"
      class="goods-pagination"
      @current-change="handleCurrentChange"
    />
    <el-dialog v-model="chartVisible" title="销量变化趋势" width="820px">
      <div v-loading="goodsLogList.length === 0" style="padding: 8px 0">
        <LineChart
          :data="goodsLogList"
          x-key="catch_date"
          y-key="sales_num"
          :width="780"
          :height="360"
        />
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import SearchForm from '@renderer/components/SearchForm.vue'
import LineChart from '@renderer/components/LineChart.vue'
import { ElMessage } from 'element-plus'
import { ref } from 'vue'
import { apiGoodsList, apiGoodsLog } from '@renderer/server/goods'
import { useRoute } from 'vue-router'
import { copyToClipboard } from '@renderer/utils/index.js'

const route = useRoute()

const props = defineProps({
  platform: {
    type: String,
    default: 'xhs'
  }
})

const dp_id = route.query.id || ''
const goodsList = ref([])
const goodsLogList = ref([])
const chartVisible = ref(false)
const getListIng = ref(false)
const total = ref(0)
const page = ref(1)
const defaultFormData = {
  dp_id,
  title: '',
  min_sales: undefined,
  min_price: undefined,
  sort: '1',
  is_new: null
}
const curFormData = ref({
  dp_id,
  title: '',
  min_sales: undefined,
  min_price: undefined,
  sort: '1',
  is_new: null
})

const columns = [
  { label: '店铺ID', prop: 'dp_id' },
  { label: '店铺名称', prop: 'dp_name' },
  { label: '商品ID', prop: 'goods_id' },
  { label: '商品标题', prop: 'title' },
  { label: '商品地址', prop: 'address' },
  { label: '商品价格', prop: 'price' },
  { label: '商品销量', prop: 'sales_num' },
  { label: '较昨日销量', prop: 'increment' }
]

const copy = (text) => {
  copyToClipboard(text)
  ElMessage.success('复制成功')
}

/**
 * 打开详情弹窗，并拉取该商品的日志数据
 */
const toDetail = async (row) => {
  goodsLogList.value = []
  chartVisible.value = true
  const res = await apiGoodsLog({
    goods_id: row.goods_id,
    dp_id: row.dp_id,
    page_size: 30
  })
  goodsLogList.value = res?.data?.data || []
}

/**
 * 拉取商品列表数据
 */
const getGoodsList = async () => {
  getListIng.value = true
  try {
    const res = await apiGoodsList({
      ...curFormData.value,
      page: page.value,
      platform: props.platform
    })
    if (res.data.code === 0) {
      goodsList.value = res.data.data.goodsList
      total.value = res.data.data.total
    } else {
      goodsList.value = []
      total.value = 0
      ElMessage.error('网络异常')
    }
  } catch {
    ElMessage.error('网络异常')
  } finally {
    getListIng.value = false
  }
}

/**
 * 分页变化时回调
 */
const handleCurrentChange = (val) => {
  page.value = val
  getGoodsList()
}

/**
 * 搜索提交
 */
const search = () => {
  page.value = 1
  getGoodsList()
}

getGoodsList()
</script>

<style scoped>
.goodsPage {
  height: 100%;
  width: 100%;
  display: flex;
  box-sizing: border-box;
  flex-direction: column;
  padding: 20px;
}
.goods-table {
  margin-top: 20px;
  flex: 1;
}
.goods-pagination {
  margin-top: 20px;
  align-self: flex-end;
}
.sort-radio-group {
  grid-column: span 2;
}
</style>
