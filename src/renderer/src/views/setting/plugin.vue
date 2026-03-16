<template>
  <div class="plugin-container">
    <div class="plugin-container-header">
      <el-button type="primary" @click="addPlugin">新增</el-button>
    </div>
    <el-table :data="plugins" border max-height="300px">
      <el-table-column prop="name" label="插件名称" />
      <el-table-column prop="hotkey" label="插件快捷键" />
      <el-table-column prop="landingPage" label="插件落地页" />
      <el-table-column prop="actions" label="操作">
        <template #default="scope">
          <el-link type="primary" @click="editPlugin(scope.row)">编辑</el-link>
          <el-link type="danger" style="margin-left: 12px" @click="deletePlugin(scope.row)">
            删除
          </el-link>
        </template>
      </el-table-column>
    </el-table>
    <!-- 插件设置dialog -->
    <el-dialog v-model="dialogVisible" title="插件设置" width="500px" destroy-on-close>
      <el-form ref="pluginFormRef" :model="pluginForm" :rules="rules" label-width="120px">
        <el-form-item label="插件名称" prop="name">
          <el-input
            v-model="pluginForm.name"
            placeholder="请输入插件名称"
            :disabled="dialogType === 'edit'"
          />
        </el-form-item>
        <el-form-item label="插件快捷键" prop="hotkey">
          <el-input
            v-model="pluginForm.hotkey"
            placeholder="点击此处按下快捷键"
            readonly
            @keydown="handleHotkeyInput"
          />
        </el-form-item>
        <el-form-item label="插件落地页" prop="landingPage">
          <el-input v-model="pluginForm.landingPage" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" @click="submitPluginForm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { clone } from '@renderer/utils/index.js'
import { ElMessage, ElMessageBox } from 'element-plus'

const plugins = ref([])
const dialogVisible = ref(false)
const dialogType = ref('add')
const pluginForm = ref({})
const pluginFormRef = ref(null)

const rules = {
  name: [{ required: true, message: '请输入插件名称', trigger: 'blur' }]
}

// 获取已经配置的插件列表
const getLocalPlugins = async () => {
  plugins.value =
    (await window.invoke({
      app: 'config',
      eventName: 'getConfig',
      configName: 'plugin'
    })) || []
}

// 新增插件
const addPlugin = () => {
  dialogType.value = 'add'
  pluginForm.value = {
    name: '',
    hotkey: '',
    landingPage: ''
  }
  dialogVisible.value = true
}

/**
 * 监听快捷键输入
 * @param {KeyboardEvent} event 键盘事件
 */
const handleHotkeyInput = (event) => {
  event.preventDefault()
  const { key, ctrlKey, shiftKey, altKey, metaKey } = event
  // 允许使用 Backspace 或 Delete 清除快捷键
  if (key === 'Backspace' || key === 'Delete') {
    pluginForm.value.hotkey = ''
    return
  }
  // 如果只按下了修饰键，不进行处理
  if (['Control', 'Shift', 'Alt', 'Meta'].includes(key)) {
    return
  }
  const modifiers = []
  if (ctrlKey) modifiers.push('Ctrl')
  if (shiftKey) modifiers.push('Shift')
  if (altKey) modifiers.push('Alt')
  if (metaKey) modifiers.push('Meta')
  // 转换键名为大写，处理特殊键
  let keyName = key
  if (keyName.length === 1) {
    keyName = keyName.toUpperCase()
  }
  if (key === ' ') keyName = 'Space'
  // 组合最终的快捷键字符串
  const hotkey = [...modifiers, keyName].join('+')
  pluginForm.value.hotkey = hotkey
}

// 提交表单
const submitPluginForm = async () => {
  if (!pluginFormRef.value) return
  await pluginFormRef.value.validate((valid, fields) => {
    if (valid) {
      if (dialogType.value === 'add') {
        // 检查插件名称是否已存在
        const nameExists = plugins.value.some((plugin) => plugin.name === pluginForm.value.name)
        if (nameExists) {
          ElMessage.warning('插件名称已存在，请重新输入')
          return
        }
        plugins.value.push(pluginForm.value)
        // 保存配置
        window.invoke({
          app: 'config',
          eventName: 'setConfig',
          configName: 'plugin',
          value: clone(plugins.value)
        })
        dialogVisible.value = false
      } else {
        // 更新插件
        const index = plugins.value.findIndex((plugin) => plugin.name === pluginForm.value.name)
        if (index !== -1) {
          plugins.value[index] = pluginForm.value
          // 保存配置
          window.invoke({
            app: 'config',
            eventName: 'setConfig',
            configName: 'plugin',
            value: clone(plugins.value)
          })
          dialogVisible.value = false
        }
      }
    } else {
      console.log('error submit!', fields)
    }
  })
}

// 编辑插件
const editPlugin = (row) => {
  dialogType.value = 'edit'
  pluginForm.value = { ...row }
  dialogVisible.value = true
}

// 删除插件
const deletePlugin = (row) => {
  ElMessageBox.confirm('确认删除插件吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    plugins.value = plugins.value.filter((plugin) => plugin !== row)
    // 保存配置
    window.invoke({
      app: 'config',
      eventName: 'setConfig',
      configName: 'plugin',
      value: clone(plugins.value)
    })
  })
}

getLocalPlugins()
</script>

<style scoped lang="less">
.plugin-container {
  &-header {
    margin-bottom: 12px;
  }
}
</style>
