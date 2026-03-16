import { BrowserWindow } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import icon from '../../../resources/icon.png?asset'

export const createChildWindow = (routePath, config) => {
  const newWindow = new BrowserWindow({
    show: false,
    autoHideMenuBar: true,
    icon,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      webSecurity: false
    },
    ...config
  })

  newWindow.on('ready-to-show', () => {
    newWindow.show()
  })

  // 如果指定了标题，阻止网页标题覆盖
  newWindow.on('page-title-updated', (e) => {
    e.preventDefault()
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    newWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/#${routePath}`)
  } else {
    newWindow.loadFile(join(__dirname, '../renderer/index.html'), { hash: routePath })
  }

  return newWindow
}
