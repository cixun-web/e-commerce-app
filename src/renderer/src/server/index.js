import axios from 'axios'

const isDev = import.meta.env && import.meta.env.DEV

let service

if (isDev) {
  service = axios.create({
    baseURL: '/api/e_commerce',
    headers: {
      'Content-Type': 'application/json;charset=utf-8'
    },
    method: 'POST',
    withCredentials: true,
    timeout: 30000,
    validateStatus() {
      return true
    },
    transformResponse: [
      (data) => {
        if (typeof data === 'string' && data.startsWith('{')) {
          data = JSON.parse(data)
        }
        return data
      }
    ]
  })
  service.interceptors.request.use(
    (config) => {
      config.data = {}
      config.data.sid = config.sid
      config.data.datas = JSON.stringify(config.datas)
      return config
    },
    (error) => {
      error.data = {}
      error.data.msg = '服务器异常，请联系管理员！'
      return Promise.resolve(error)
    }
  )
} else {
  service = (config) => {
    const payload = {
      url: 'http://www.cixun.vip/api/e_commerce',
      body: {
        sid: config.sid,
        // 生产环境通过 IPC 传输，确保 datas 可被结构化克隆
        // 使用深拷贝去除 Vue 响应式 Proxy、方法等不可克隆内容
        datas: JSON.parse(JSON.stringify(config.datas ?? {}))
      },
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json;charset=utf-8'
      }
    }
    return window.electron.ipcRenderer.invoke('api:request', payload)
  }
}

export default service
