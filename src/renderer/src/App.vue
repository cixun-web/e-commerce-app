<script setup>
import { onMounted, onUnmounted } from 'vue'

/**
 * 监听 e2e-progress 事件，更新 localStorage 中的 ui-group-list
 * @param {Object} _event 事件对象
 * @param {Object} data 数据对象，包含 stepId, groupId, caseId, status, errTip
 */
const updateStepStatus = (_event, data) => {
  const { stepId, groupId, caseId, status, errTip } = data
  if (groupId === -2 || !groupId || !caseId) return

  try {
    const groupListStr = localStorage.getItem('ui-group-list')
    if (!groupListStr) return
    const groupList = JSON.parse(groupListStr)

    const groupIndex = groupList.findIndex((g) => g.id === groupId)
    if (groupIndex === -1) return

    const group = groupList[groupIndex]
    if (!group.cases || !Array.isArray(group.cases)) return

    let isUpdated = false

    // 如果有 caseId，直接查找对应的 case
    const targetCase = group.cases.find((c) => c.uid === caseId || c.id === caseId)

    // 如果找到了 case，直接在 case 中查找 step
    if (targetCase) {
      let steps = []
      try {
        steps =
          typeof targetCase.steps === 'string' ? JSON.parse(targetCase.steps) : targetCase.steps
      } catch {
        // 解析失败，忽略
      }

      if (Array.isArray(steps)) {
        const stepIndex = steps.findIndex((s) => s.id === stepId)
        if (stepIndex !== -1) {
          steps[stepIndex].status = status
          if (errTip) {
            steps[stepIndex].errTip = errTip
          }
          targetCase.steps = JSON.stringify(steps)
          isUpdated = true
        }
      }
    }

    if (isUpdated) {
      localStorage.setItem('ui-group-list', JSON.stringify(groupList))
    }
  } catch (error) {
    console.error('Failed to update progress:', error)
  }
}

/**
 * 监听 e2e-group-start 事件，重置 localStorage 中对应 group 的 steps 状态
 * @param {Object} _event 事件对象
 * @param {Object} data 数据对象，包含 groupId
 */
const resetGroupStatus = (_event, data) => {
  const { groupId } = data
  if (!groupId) return

  try {
    const groupListStr = localStorage.getItem('ui-group-list')
    if (!groupListStr) return
    const localGroupList = JSON.parse(groupListStr)

    const groupIndex = localGroupList.findIndex((g) => g.id === groupId)
    if (groupIndex === -1) return

    const group = localGroupList[groupIndex]
    if (!group.cases || !Array.isArray(group.cases)) return

    let isUpdated = false

    group.cases.forEach((caseItem) => {
      let steps = []
      try {
        steps = typeof caseItem.steps === 'string' ? JSON.parse(caseItem.steps) : caseItem.steps
      } catch {
        return
      }

      if (!Array.isArray(steps)) return

      let hasChange = false
      steps.forEach((step) => {
        if (step.status || step.errTip) {
          delete step.status
          delete step.errTip
          hasChange = true
        }
      })

      if (hasChange) {
        caseItem.steps = JSON.stringify(steps)
        isUpdated = true
      }
    })

    if (isUpdated) {
      localStorage.setItem('ui-group-list', JSON.stringify(localGroupList))
    }
  } catch (error) {
    console.error('Failed to reset group status:', error)
  }
}

const cetE2eLog = (_event, data) => {
  const { level, message } = data
  if (!level || !message) return
  const logList = JSON.parse(sessionStorage.getItem('e2e-logs') || '[]')
  logList.push({ level, message })
  sessionStorage.setItem('e2e-logs', JSON.stringify(logList))
}

onMounted(() => {
  window.electron?.ipcRenderer?.on('e2e-progress', updateStepStatus)
  window.electron?.ipcRenderer?.on('e2e-group-start', resetGroupStatus)
  window.electron?.ipcRenderer?.on('e2e-logs', cetE2eLog)
})

onUnmounted(() => {
  window.electron?.ipcRenderer?.removeListener('e2e-progress', updateStepStatus)
  window.electron?.ipcRenderer?.removeListener('e2e-group-start', resetGroupStatus)
  window.electron?.ipcRenderer?.removeListener('e2e-logs', cetE2eLog)
})
</script>

<template>
  <RouterView />
</template>
