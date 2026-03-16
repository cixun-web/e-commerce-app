<template>
  <div class="">
    <div class="flex items-center">
      <!-- 名称 -->
      <el-input
        v-model="caseItem.name"
        placeholder="请输入名称"
        class="mb-2"
        style="width: 300px"
      />
      <div class="ml-3 cursor-pointer" @click="handleSetting">
        <el-icon><Setting /></el-icon>
      </div>
      <el-switch
        v-model="caseItem.isDisabled"
        class="ml-auto"
        active-text="禁用"
        inactive-text="启用"
        inline-prompt
        style="--el-switch-on-color: #ff4949; --el-switch-off-color: #13ce66"
      />
      <el-link type="danger" class="ml-2" @click="handleDelete(caseItem.uid)">删除</el-link>
    </div>
    <!-- 数据源 -->
    <DataSource v-model="caseItem.data_source" />
    <!-- 进度 -->
    <Steps v-model="caseItem.steps" />
    <el-dialog v-model="dialogVisible" title="设置" width="400px">
      <el-form>
        <el-form-item label="下载地址">
          <el-input v-model="download_url" placeholder="下载" readonly @click="selectPath" />
        </el-form-item>
        <el-form-item label="命名方式">
          <el-input v-model="naming_way" placeholder="$[流程名称]-$[名称]-$[完成时间戳]" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="danger" @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveSetting">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Steps from '@renderer/components/ui/steps.vue'
import DataSource from '@renderer/components/ui/data-source.vue'
import { ElMessage } from 'element-plus'

const caseItem = defineModel({
  default: () => ({
    name: '',
    data_source: '',
    steps: [],
    isDisabled: false
  }),
  type: Object
})

const emit = defineEmits(['delete'])

const dialogVisible = ref(false)
const download_url = ref('')
const naming_way = ref('')

const handleSetting = () => {
  download_url.value = caseItem.value.download_url
  naming_way.value = caseItem.value.naming_way
  dialogVisible.value = true
}

const selectPath = async () => {
  try {
    const result = await window.invoke({
      app: 'sys',
      eventName: 'chooseDir'
    })
    if (result) {
      download_url.value = result
    }
  } catch (error) {
    ElMessage.error('选择路径失败' + error)
  }
}

const handleDelete = (uid) => {
  emit('delete', uid)
}

const handleSaveSetting = () => {
  caseItem.value.download_url = download_url.value
  caseItem.value.naming_way = naming_way.value
  dialogVisible.value = false
}
</script>
