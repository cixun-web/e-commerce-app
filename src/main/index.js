import { app, shell, BrowserWindow, ipcMain, screen, net } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import config from './config'
import handleEvent from './handleEvent'
import { initGpuEncoder } from './ffmpeg/gpu-manager'

let screenWidth, screenHeight

const serializeForIPC = (value) => {
  const seen = new WeakSet()
  const _s = (v) => {
    if (v === null) return null
    if (v === undefined) return null
    const t = typeof v
    if (t === 'string' || t === 'number' || t === 'boolean') return v
    if (t === 'bigint') return v.toString()
    if (Array.isArray(v)) return v.map(_s)
    if (t === 'object') {
      if (seen.has(v)) return null
      seen.add(v)
      if (v instanceof Map) {
        return Object.fromEntries([...v.entries()].map(([k, val]) => [String(k), _s(val)]))
      }
      if (v instanceof Set) {
        return [...v].map(_s)
      }
      if (typeof Buffer !== 'undefined' && Buffer.isBuffer && Buffer.isBuffer(v)) {
        return v.toString('base64')
      }
      const plain = {}
      for (const [k, val] of Object.entries(v)) {
        try {
          plain[k] = _s(val)
        } catch {
          plain[k] = null
        }
      }
      return plain
    }
    return String(v)
  }
  return _s(value)
}

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: Math.round(screenWidth * 0.8),
    height: Math.round(screenHeight * 0.8),
    show: false,
    autoHideMenuBar: true,
    title: '电商工具箱',
    icon,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      webSecurity: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  const primaryDisplay = screen.getPrimaryDisplay()
  const { width, height } = primaryDisplay.workAreaSize
  screenWidth = width
  screenHeight = height
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.handle('api:request', async (_event, { url, body, headers, timeout }) => {
    return new Promise((resolve) => {
      const request = net.request({
        method: 'POST',
        url: url || 'http://www.cixun.vip/api/e_commerce'
      })
      const _headers = Object.assign(
        { 'Content-Type': 'application/json;charset=utf-8' },
        headers || {}
      )
      Object.entries(_headers).forEach(([k, v]) => request.setHeader(k, v))
      let chunks = []
      request.on('response', (response) => {
        response.on('data', (chunk) => {
          chunks.push(Buffer.from(chunk))
        })
        response.on('end', () => {
          const buf = Buffer.concat(chunks)
          const text = buf.toString('utf-8')
          let data = text
          if (text.startsWith('{')) {
            try {
              data = JSON.parse(text)
            } catch {
              data = text
            }
          }
          resolve({ data })
        })
      })
      const to = setTimeout(
        () => {
          try {
            request.abort()
          } catch {
            // ignore
          }
          resolve({ data: { code: -1, message: 'timeout' } })
        },
        Math.max(0, timeout || 30000)
      )
      request.on('error', () => {
        clearTimeout(to)
        resolve({ data: { code: -1, message: 'network error' } })
      })
      request.write(
        JSON.stringify({
          sid: body?.sid,
          datas: JSON.stringify(body?.datas || {})
        })
      )
      request.end()
    })
  })

  // handle 事件转发处理中心
  ipcMain.handle('handleEvent', async (_event, params) => {
    const { app, eventName, ...rest } = params
    if (!app)
      return {
        status: 'error',
        message: '请指定应用'
      }
    if (!eventName)
      return {
        status: 'error',
        message: '请指定事件名'
      }
    const wc = _event.sender
    const boundSend = wc.send.bind(wc)
    const safeSend = (...args) => {
      if (!wc || wc.isDestroyed()) return
      try {
        boundSend(...args)
      } catch {
        /* empty */
      }
    }
    const result = await handleEvent({
      app,
      eventName,
      params: { ...rest, screenWidth, screenHeight },
      send: safeSend,
      config
    })
    return serializeForIPC(result)
  })

  createWindow()

  app.on('activate', function () {
    // 创建新窗口
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
  // 初始化 GPU 编码器，此时 ffmpeg 模块已经被加载
  console.warn('初始化 GPU 编码器')
  initGpuEncoder()
})

// 退出应用
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
