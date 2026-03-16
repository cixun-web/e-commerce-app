import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import { useUserStore } from '@renderer/store/user'

const app = createApp(App)
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

const checkPermission = (el, binding) => {
  const userStore = useUserStore()
  const code = binding.value
  if (code === undefined || code === null) {
    return
  }
  const permissions = userStore.permission || []
  let codeArr = []
  if (Array.isArray(code)) {
    codeArr = code
  } else {
    codeArr.push(code)
  }
  const hasPermission = codeArr.some((item) => permissions.includes(String(item)))
  el.style.display = hasPermission ? '' : 'none'
}

app.directive('fac', {
  mounted(el, binding) {
    checkPermission(el, binding)
  },
  updated(el, binding) {
    checkPermission(el, binding)
  }
})

app.use(router)
app.use(pinia)
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}
app.use(ElementPlus, {
  locale: zhCn
})
app.mount('#app')
