<template>
  <el-dialog v-model="dialogVisible" title="新增权限" width="500px">
    <el-form ref="formRef" :model="form" label-width="100px">
      <el-form-item label="归属权限" prop="parent_id">
        <el-select v-model="form.parent_id">
          <el-option
            v-for="item in permissionStore.cascadeList"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="权限名" prop="name" required>
        <el-input v-model="form.name" type="text" autocomplete="off" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button type="primary" @click="submitForm">确定</el-button>
      <el-button @click="dialogVisible = false">取消</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import { apiAddPermission } from '@renderer/server/permission'
import { usePermissionStore } from '@renderer/store/permission'

const dialogVisible = defineModel({
  default: false,
  type: Boolean
})

const emits = defineEmits(['addSuccess'])

const form = ref({})

watch(
  dialogVisible,
  (val) => {
    if (val) {
      form.value = {
        name: '',
        parent_id: ''
      }
    }
  },
  {
    immediate: true
  }
)

const permissionStore = usePermissionStore()

const submitForm = () => {
  if (!form.value.name) {
    ElMessage.error('请输入权限名')
    return
  }
  ElMessageBox.confirm('确认新增权限吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 确认新增权限
    apiAddPermission(form.value).then((res) => {
      if (res.data.code === 0) {
        ElMessage.success('新增权限成功')
        dialogVisible.value = false
        emits('addSuccess')
      } else {
        ElMessage.error(res.data.message || '新增权限失败')
      }
    })
  })
}
</script>
