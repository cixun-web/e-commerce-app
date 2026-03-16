<template>
  <el-dialog v-model="visible" title="新增操作" width="80%" destroy-on-close @close="handleClose">
    <div class="w-[400px] mb-4 ml-5">
      <el-select
        v-model="templateId"
        placeholder="选择模板"
        clearable
        filterable
        @change="getTemplateDetail"
      >
        <el-option
          v-for="item in templateList"
          :key="item.id"
          :label="item.name"
          :value="item.id"
        />
      </el-select>
    </div>
    <el-form ref="stepFormRef" :model="stepForm" :rules="rules" label-width="100px" class="pr-4">
      <el-form-item label="操作名称" prop="name">
        <el-input v-model="stepForm.name" placeholder="请输入操作名称" />
      </el-form-item>
      <el-form-item label="操作代码" prop="code">
        <MonacoEditor
          v-model="stepForm.code"
          language="javascript"
          height="140px"
          class="w-full border border-gray-300 rounded"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取 消</el-button>
      <el-button type="primary" @click="handleAddStep">确 认</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref } from 'vue'
import MonacoEditor from '@renderer/components/MonacoEditor.vue'
import { apiBrowserTemplateDetail } from '@renderer/server/browser-template'

const emits = defineEmits(['confirm'])
defineProps({
  templateList: {
    default: () => [],
    type: Array
  }
})

const templateId = ref('')
const rules = ref({
  name: [{ required: true, message: '请输入操作名称', trigger: 'blur' }]
})

const visible = defineModel({
  default: false,
  type: Boolean
})
const stepForm = ref({
  name: '',
  code: ''
})
const stepFormRef = ref(null)

const getTemplateDetail = async (id) => {
  if (!id) return
  try {
    const res = await apiBrowserTemplateDetail({ id })
    if (res.data.code === 0) {
      const oldId = stepForm.value.id
      stepForm.value = res.data.data
      oldId && (stepForm.value.id = oldId)
    }
  } catch (error) {
    console.error(error)
  }
}

const handleAddStep = async () => {
  const valid = await stepFormRef.value.validate()
  if (!valid) {
    return
  }
  emits('confirm', stepForm.value)
}

const handleClose = () => {
  stepForm.value = {}
  templateId.value = ''
}

defineExpose({
  getTemplateDetail
})
</script>
