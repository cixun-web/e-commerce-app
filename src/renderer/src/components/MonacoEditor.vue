<template>
  <div class="monaco-editor-wrapper" :class="{ 'is-fullscreen': isFullscreen }">
    <div ref="editorContainer" class="monaco-editor-container" :style="containerStyle"></div>
    <el-button
      class="fullscreen-btn"
      circle
      size="small"
      :icon="isFullscreen ? Close : FullScreen"
      title="切换全屏"
      @click="toggleFullscreen"
    />
  </div>
</template>

<script setup>
/**
 * Monaco Editor Component
 * Wraps monaco-editor for Vue 3
 */
import { ref, onMounted, onUnmounted, watch, computed, nextTick } from 'vue'
import * as monaco from 'monaco-editor'
import { FullScreen, Close } from '@element-plus/icons-vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  language: {
    type: String,
    default: 'javascript'
  },
  theme: {
    type: String,
    default: 'vs-dark'
  },
  options: {
    type: Object,
    default: () => ({})
  },
  width: {
    type: String,
    default: '100%'
  },
  height: {
    type: String,
    default: '300px'
  }
})

const emits = defineEmits(['update:modelValue', 'change', 'editor-mounted'])

const editorContainer = ref(null)
const isFullscreen = ref(false)
let editorInstance = null

const containerStyle = computed(() => {
  if (isFullscreen.value) {
    return { height: '100%', width: '100%' }
  }
  return { height: props.height, width: props.width }
})

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
  // Force layout update after transition
  nextTick(() => {
    if (editorInstance) {
      editorInstance.layout()
    }
  })
}

onMounted(() => {
  if (editorContainer.value) {
    // Initialize Monaco Editor
    editorInstance = monaco.editor.create(editorContainer.value, {
      value: props.modelValue,
      language: props.language,
      theme: props.theme,
      automaticLayout: true, // Automatically handle layout changes
      minimap: { enabled: false }, // Disable minimap by default, can be overridden via options
      scrollbar: {
        alwaysConsumeMouseWheel: false // Allow scrolling parent when edge is reached
      },
      ...props.options
    })

    // Listen for content changes
    editorInstance.onDidChangeModelContent(() => {
      const value = editorInstance.getValue()
      emits('update:modelValue', value)
      emits('change', value)
    })

    emits('editor-mounted', editorInstance)
  }
})

// Watch for prop changes to update editor
watch(
  () => props.modelValue,
  (newValue) => {
    if (editorInstance && newValue !== editorInstance.getValue()) {
      editorInstance.setValue(newValue || '')
    }
  }
)

watch(
  () => props.language,
  (newValue) => {
    if (editorInstance) {
      monaco.editor.setModelLanguage(editorInstance.getModel(), newValue)
    }
  }
)

watch(
  () => props.theme,
  (newValue) => {
    if (editorInstance) {
      monaco.editor.setTheme(newValue)
    }
  }
)

watch(
  () => props.options,
  (newValue) => {
    if (editorInstance) {
      editorInstance.updateOptions(newValue)
    }
  },
  { deep: true }
)

onUnmounted(() => {
  if (editorInstance) {
    editorInstance.dispose()
  }
})
</script>

<style scoped>
.monaco-editor-wrapper {
  position: relative;
  width: 100%;
}

.monaco-editor-wrapper.is-fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  background-color: white;
  padding: 0;
  border-radius: 0 !important;
  border: none !important;
}

.monaco-editor-container {
  overflow: hidden;
  /* border and border-radius removed to allow parent styling */
}

.monaco-editor-wrapper.is-fullscreen .monaco-editor-container {
  height: 100% !important;
  width: 100% !important;
}

.fullscreen-btn {
  position: absolute;
  right: 20px;
  top: 10px;
  z-index: 2001;
  opacity: 0.6;
  transition: opacity 0.3s;
}

.fullscreen-btn:hover {
  opacity: 1;
}
</style>
