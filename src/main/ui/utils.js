import path from 'path'
import fs from 'fs'
import { app } from 'electron'

// chrome.exe文件位置
export const resolveExecutablePath = () => {
  // 1. 确定 browsers 目录路径
  let browsersPath
  if (app.isPackaged) {
    browsersPath = path.join(process.resourcesPath, 'browsers')
  } else {
    browsersPath = path.join(process.cwd(), 'resources', 'browsers')
  }
  // 如果目录不存在，返回 undefined，让 Playwright 使用默认路径
  if (!fs.existsSync(browsersPath)) {
    return ''
  }

  try {
    // 2. 查找 chromium-xxx 目录
    const entries = fs.readdirSync(browsersPath)
    const chromiumDir = entries.find(
      (entry) =>
        entry.startsWith('chromium-') && fs.statSync(path.join(browsersPath, entry)).isDirectory()
    )
    if (!chromiumDir) {
      return ''
    }
    const chromiumPath = path.join(browsersPath, chromiumDir)
    // 3. 查找具体的可执行文件，优先检查 Windows 路径，因为当前环境是 Windows
    const candidates = [
      path.join(chromiumPath, 'chrome-win64', 'chrome.exe'),
      path.join(chromiumPath, 'chrome-win', 'chrome.exe'),
      // 兼容其他平台路径
      path.join(chromiumPath, 'chrome-linux', 'chrome'),
      path.join(chromiumPath, 'chrome-mac', 'Chromium.app', 'Contents', 'MacOS', 'Chromium'),
      path.join(chromiumPath, 'chrome-mac', 'Google Chrome for Testing.app', 'Contents', 'MacOS', 'Google Chrome for Testing'),
      path.join(chromiumPath, 'chrome-mac-arm64', 'Google Chrome for Testing.app', 'Contents', 'MacOS', 'Google Chrome for Testing')
    ]

    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        return candidate
      }
    }
  } catch (error) {
    console.error('Error resolving executable path:', error)
  }

  return ''
}

// 浏览器默认配置
export const browserOptions = {
  headless: false,
  viewport: null,
  channel: 'chromium',
  args: [
    '--disable-gpu', // 尝试解决图形渲染导致的崩溃
    '--start-maximized'
  ],
  ignoreDefaultArgs: ['--disable-extensions']
}

// 获取本地用户数据缓存地址
export const getUserDataDir = (appName) => {
  return path.join(app.getPath('userData'), `${appName}-ui`)
}

// 清除本地用户数据缓存
export const clearUserDataDir = (appName) => {
  const userDataDir = getUserDataDir(appName)
  console.log('清除本地缓存', userDataDir)
  if (fs.existsSync(userDataDir)) {
    fs.rmSync(userDataDir, { recursive: true, force: true })
  }
}
