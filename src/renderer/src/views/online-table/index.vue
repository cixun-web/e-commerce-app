<template>
  <div class="h-full bg-white box-border p-5 flex flex-col">
    <div class="flex justify-between">
      <div>
        <el-tooltip content="导入表格, 如果已有数据，则覆盖之前导入" placement="top">
          <el-button type="primary" @click="uploadXlsx">导入表格</el-button>
        </el-tooltip>
        <el-button type="primary" @click="temListDialogVisible = true">模板列表</el-button>
        <el-tooltip :content="`下载目录: ${downDir}`" placement="top">
          <el-button type="primary" @click="setDownDir">下载列表</el-button>
        </el-tooltip>
      </div>
      <div>
        <el-button type="primary" :disabled="tableData.length === 0" @click="openFilterDialog">
          筛选条件
        </el-button>
        <el-button type="primary" :disabled="tableData.length === 0" @click="downloadXlsx">
          下载
        </el-button>
      </div>
    </div>
    <div class="flex-1 overflow-auto flex flex-col mt-4">
      <template v-if="tableData.length > 0">
        <el-table :data="showData" class="flex-1">
          <el-table-column
            v-for="(header, hIndex) in tableHeaders"
            :key="header + hIndex"
            :prop="header"
            :label="header"
          >
            <template #default="{ row }">
              <img
                v-if="row[header] && String(row[header]).indexOf('data:image/') > -1"
                :src="row[header]"
                class="max-h-20 max-w-[120px] block"
              />
              <span v-else>
                <el-tooltip v-if="row[header] && row[header].length > 30" :content="row[header]">
                  {{ row[header].slice(0, 30) }}
                </el-tooltip>
                <span v-else>{{ row[header] || '' }}</span>
              </span>
            </template>
          </el-table-column>
        </el-table>
        <el-pagination layout="total" :total="showData.length" class="mt-5 flex justify-end" />
      </template>
      <div v-else class="text-center mt-20 text-gray-500">请导入数据</div>
    </div>
    <el-dialog v-model="filterDialogVisible" title="筛选条件">
      <div>
        <el-form>
          <!-- 映射关系 -->
          <div class="flex items-center justify-between mb-4">
            <span>生成可导入视频下载工具xlsx</span>
            <el-checkbox v-model="tempMapping.isChecked">生成</el-checkbox>
          </div>
          <el-form-item label="数据类型">
            <el-select
              v-model="tempMapping.type"
              :disabled="!tempMapping.isChecked"
              placeholder="请选择"
              clearable
            >
              <el-option label="点赞量" value="dz"></el-option>
              <el-option label="曝光量" value="bg"></el-option>
              <el-option label="成交" value="cj"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="数据表现">
            <el-select
              v-model="tempMapping.dataType"
              :disabled="!tempMapping.isChecked"
              placeholder="请选择"
              clearable
            >
              <el-option v-for="op in tableHeaders" :key="op" :label="op" :value="op"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="视频链接">
            <el-select
              v-model="tempMapping.videoUrl"
              :disabled="!tempMapping.isChecked"
              placeholder="请选择"
              clearable
            >
              <el-option v-for="op in tableHeaders" :key="op" :label="op" :value="op"></el-option>
            </el-select>
          </el-form-item>
          <el-divider></el-divider>
          <!-- 筛选条件 -->
          <el-form-item v-for="header in tableHeaders" :key="header" :label="header">
            <el-select v-model="tempFilterForm[header].type" placeholder="请选择" class="mr-2 w-40">
              <el-option label="数值大于等于" value="number_gte"></el-option>
              <el-option label="数值小于等于" value="number_lte"></el-option>
              <el-option label="其中之一" value="text"></el-option>
              <el-option label="不至其中之一" value="not_text"></el-option>
            </el-select>
            <template v-if="tempFilterForm[header].type === 'number_gte'">
              <el-input
                v-model="tempFilterForm[header].value"
                placeholder="请输入数值"
                class="flex-1 mt-2"
              />
            </template>
            <template v-else-if="tempFilterForm[header].type === 'number_lte'">
              <el-input
                v-model="tempFilterForm[header].value"
                placeholder="请输入数值"
                class="flex-1 mt-2"
              />
            </template>
            <template
              v-else-if="
                tempFilterForm[header].type === 'text' || tempFilterForm[header].type === 'not_text'
              "
            >
              <el-select
                v-model="tempFilterForm[header].inArr"
                placeholder="请选择"
                multiple
                filterable
                allow-create
                clearable
                class="flex-1 mt-2"
              >
                <el-option
                  v-for="(opt, idx) in uniqueValues(header)"
                  :key="String(opt) + '-' + idx"
                  :label="String(opt)"
                  :value="opt"
                />
              </el-select>
            </template>
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="filterDialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="saveToTemplate">存为模板</el-button>
        <el-button type="primary" @click="filterData">确 定</el-button>
      </template>
    </el-dialog>
    <temList ref="temListRef" v-model="temListDialogVisible" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import temList from './tem-list.vue'
import dayjs from 'dayjs'
import { getFilterData, getDownFormData } from './utils'

const tableData = ref([])
const showData = ref([])
const tableHeaders = ref([])
const downDir = ref('')
const filterDialogVisible = ref(false)
const temListDialogVisible = ref(false)
const filterForm = ref({})
const mapping = ref({
  isChecked: false,
  type: '',
  dataType: '',
  videoUrl: ''
})
const tempFilterForm = ref({})
const tempMapping = ref({})

// 打开筛选弹窗，初始化临时变量
const openFilterDialog = () => {
  tempFilterForm.value = JSON.parse(JSON.stringify(filterForm.value))
  tempMapping.value = JSON.parse(JSON.stringify(mapping.value))
  filterDialogVisible.value = true
}

const getDownDir = async () => {
  downDir.value = await window.invoke({
    app: 'onlineData',
    eventName: 'getDownDir'
  })
}

const setDownDir = async () => {
  const res = await window.invoke({
    app: 'sys',
    eventName: 'chooseDir'
  })
  if (res) {
    downDir.value = res
    await window.invoke({
      app: 'onlineData',
      eventName: 'setDownDir',
      downDir: downDir.value
    })
    ElMessage.success('设置成功')
  }
}

const uniqueValues = (header) => {
  const set = new Set()
  const res = []
  for (const row of tableData.value) {
    const val = row?.[header]
    if (val === undefined || val === null || val === '') continue
    const k = typeof val === 'string' ? val : JSON.stringify(val)
    if (!set.has(k)) {
      set.add(k)
      res.push(val)
    }
  }
  return res
}

const uploadXlsx = async () => {
  const res = await window.invoke({
    app: 'onlineData',
    eventName: 'uploadXlsx'
  })
  if (res?.status === 'success') {
    const { headers = [], rows = [] } = res?.data || {}
    tableHeaders.value = headers
    filterForm.value = headers.reduce((pre, cur) => {
      pre[cur] = {
        type: 'number_gte',
        value: '',
        inArr: []
      }
      return pre
    }, {})
    mapping.value = {
      isChecked: false,
      type: '',
      dataType: '',
      videoUrl: ''
    }
    tableData.value = rows
    showData.value = rows
  }
}

// 将配置存为模板
const saveToTemplate = () => {
  ElMessageBox.prompt('请输入模板名称', '提示', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    inputPattern: /\S+/,
    inputErrorMessage: '请输入模板名称'
  })
    .then(async ({ value }) => {
      try {
        const templates = JSON.parse(localStorage.getItem('onlineData_templates') || '[]')
        const idx = templates.findIndex((item) => item.name === value)
        const newTemplate = {
          name: value,
          filterForm: JSON.parse(JSON.stringify(tempFilterForm.value)),
          mapping: JSON.parse(JSON.stringify(tempMapping.value))
        }
        if (idx > -1) {
          templates.splice(idx, 1, newTemplate)
        } else {
          templates.push(newTemplate)
        }
        localStorage.setItem('onlineData_templates', JSON.stringify(templates))
        ElMessage.success('保存成功')
      } catch (error) {
        console.log(error, 'error')
        ElMessage.error('保存失败')
      }
    })
    .catch(() => {
      ElMessage({
        type: 'info',
        message: 'Input canceled'
      })
    })
}

// 根据条件过滤
const filterData = () => {
  filterForm.value = JSON.parse(JSON.stringify(tempFilterForm.value))
  mapping.value = JSON.parse(JSON.stringify(tempMapping.value))
  showData.value = getFilterData(tableData.value, filterForm.value)
  filterDialogVisible.value = false
}

const downloadXlsx = async () => {
  ElMessage.success('下载中...')
  // 当前时间戳
  const timestamp = dayjs().unix()
  await window.invoke({
    app: 'onlineData',
    eventName: 'downloadXlsx',
    headers: JSON.parse(JSON.stringify(tableHeaders.value)),
    rows: JSON.parse(JSON.stringify(showData.value)),
    filename: `筛选表-${timestamp}`
  })
  if (mapping.value.isChecked) {
    const downRows = getDownFormData(showData.value, mapping.value)
    console.log(downRows, 'downRows')
    await window.invoke({
      app: 'onlineData',
      eventName: 'downloadXlsx',
      headers: ['数据类型', '数据表现', '视频链接'],
      rows: JSON.parse(JSON.stringify(downRows)),
      filename: `映射表-${timestamp}`
    })
  }
  ElMessage.success('下载完成')
}

getDownDir()
</script>
