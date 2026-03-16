<template>
  <div class="h-full w-full flex flex-col p-5 box-border">
    <SearchForm v-model="curFormData" :default-form-data="defaultFormData" @search="search">
      <template #searchForm="scope">
        <el-form-item label="店铺名称：" prop="name">
          <el-input v-model="scope.searchForm.name"></el-input>
        </el-form-item>
        <el-form-item v-if="platform === 'xhs'" label="最小粉丝数：" prop="min_fans">
          <el-input-number v-model="scope.searchForm.min_fans" :min="0"></el-input-number>
        </el-form-item>
        <el-form-item label="最小销量数：" prop="min_sales">
          <el-input-number v-model="scope.searchForm.min_sales" :min="0"></el-input-number>
        </el-form-item>
        <el-form-item label="已售排序：" prop="sales_sort">
          <el-radio-group v-model="scope.searchForm.sales_sort">
            <el-radio value="1">升序</el-radio>
            <el-radio value="-1">降序</el-radio>
          </el-radio-group>
        </el-form-item>
      </template>
    </SearchForm>
    <div style="display: flex; align-items: center">
      <!-- <el-upload
        :show-file-list="false"
        :auto-upload="false"
        accept=".xlsx"
        :on-change="handleBatchFile"
      >
      </el-upload> -->
      <el-button type="primary" @click="addDp">新增</el-button>
    </div>
    <el-table :data="dpList" class="mt-5 flex-1">
      <el-table-column
        v-for="item in columns"
        :key="item.prop"
        :label="item.label"
        :prop="item.prop"
      >
        <template #default="scope">
          <div class="line-clamp-3 overflow-hidden" @click="copy(scope.row[item.prop])">
            {{ scope.row[item.prop] }}
          </div>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="80px" align="center">
        <template #default="scope">
          <el-link type="danger" style="margin-left: 10px" @click="deleteDp(scope.row)">
            删除
          </el-link>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination
      :total="total"
      :page-size="10"
      class="mt-5 self-end"
      @current-change="handleCurrentChange"
    />
    <el-dialog v-model="addVisible" title="新增店铺" width="500px">
      <el-form :model="addForm" label-width="100px">
        <el-form-item label="店铺名">
          <el-input
            v-model="addForm.name"
            type="textarea"
            :autosize="{ minRows: 3, maxRows: 8 }"
            placeholder="请输入店铺名（每行一个）"
          />
        </el-form-item>
        <el-form-item label="店铺地址">
          <el-input
            v-model="addForm.url"
            type="textarea"
            :autosize="{ minRows: 3, maxRows: 8 }"
            placeholder="请输入店铺地址或ID（每行一个）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="addVisible = false">取消</el-button>
          <el-button type="primary" :loading="addLoading" @click="saveDp">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import SearchForm from '@renderer/components/SearchForm.vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ref } from 'vue'
import { apiDpList, apiDpAdd, apiDpDelete } from '@renderer/server/dp'
import { copyToClipboard } from '@renderer/utils/index.js'

const props = defineProps({
  platform: {
    type: String,
    default: 'xhs'
  }
})

const dpList = ref([])
const total = ref(0)
const page = ref(1)
const defaultFormData = { name: '', min_fans: undefined, min_sales: undefined, sales_sort: '-1' }
const curFormData = ref({ name: '', min_fans: undefined, min_sales: undefined, sales_sort: '-1' })

const columns =
  props.platform === 'xhs'
    ? [
        { label: '店铺ID', prop: 'id' },
        { label: '店铺名', prop: 'name' },
        { label: '店铺地址', prop: 'address' },
        { label: '粉丝数', prop: 'fans_amount' },
        { label: '店铺已售', prop: 'sales_num' }
      ]
    : [
        { label: '店铺ID', prop: 'id' },
        { label: '店铺名', prop: 'name' },
        { label: '店铺地址', prop: 'address' },
        { label: '店铺已售', prop: 'sales_num' }
      ]

const copy = (text) => {
  copyToClipboard(text)
  ElMessage.success('复制成功')
}

const deleteDp = async (row) => {
  ElMessageBox.confirm('确认删除店铺吗？', '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    const res = await apiDpDelete({
      ids: [row.id]
    })
    if (res.data.code === 0) {
      ElMessage.success('删除成功')
      getDpList()
    } else {
      ElMessage.error('删除失败')
    }
  })
}

const addVisible = ref(false)
const addForm = ref({ name: '', url: '' })
const addLoading = ref(false)

const addDp = () => {
  addForm.value = { name: '', url: '' }
  addVisible.value = true
}

const saveDp = async () => {
  const nameText = addForm.value.name?.trim() || ''
  const urlText = addForm.value.url?.trim() || ''
  if (!nameText || !urlText) {
    ElMessage.warning('请填写完整')
    return
  }
  const nameLines = nameText.split(/\r?\n/).map((s) => s.trim()).filter(Boolean)
  const urlLines = urlText.split(/\r?\n/).map((s) => s.trim()).filter(Boolean)
  if (urlLines.length === 0 || nameLines.length === 0) {
    ElMessage.warning('请填写完整')
    return
  }
  if (nameLines.length !== 1 && nameLines.length !== urlLines.length) {
    ElMessage.warning('店铺名与地址行数不一致')
    return
  }
  const names = nameLines.length === 1 ? Array(urlLines.length).fill(nameLines[0]) : nameLines
  addLoading.value = true
  try {
    const ids = []
    const addresses = []
    if (props.platform === 'bdyx') {
      const getId = (u) => {
        const match = u.match(/shopId=(\d+)/)
        return match ? match[1] : ''
      }
      for (let i = 0; i < urlLines.length; i++) {
        let finalUrl = urlLines[i]
        let parsedId = getId(finalUrl)
        if (!parsedId) {
          try {
            const res = await window.invoke({
              app: 'sys',
              eventName: 'expandUrl',
              url: finalUrl
            })
            if (res.status === 'success' && res.url && res.url !== finalUrl) {
              finalUrl = res.url
              parsedId = getId(finalUrl)
            }
          } catch (e) {
            void e
          }
        }
        if (!parsedId) {
          ElMessage.error('无法解析店铺ID，请检查链接')
          return
        }
        ids.push(parsedId)
        addresses.push(finalUrl)
      }
    } else {
      ids.push(...urlLines)
    }
    const params = {
      ids,
      names,
      addresses: props.platform === 'bdyx' ? addresses : [],
      platform: props.platform
    }
    const res = await apiDpAdd(params)
    if (res.data.code === 0) {
      ElMessage.success('新增成功')
      addVisible.value = false
      getDpList()
    } else {
      ElMessage.error(res.data.message || '新增失败')
    }
  } catch (err) {
    ElMessage.error('系统异常：' + err.message)
  } finally {
    addLoading.value = false
  }
}

const getDpList = async () => {
  const res = await apiDpList({
    ...curFormData.value,
    page: page.value,
    platform: props.platform
  })
  if (res.data.code === 0) {
    dpList.value = res.data.data.dpList
    total.value = res.data.data.total
  } else {
    dpList.value = []
    total.value = 0
    ElMessage.error(res.data.message || '网络异常')
  }
}

const handleCurrentChange = (val) => {
  page.value = val
  getDpList()
}

const search = () => {
  page.value = 1
  getDpList()
}

getDpList()
</script>
