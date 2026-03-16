/**
 * 系统相关操作
 */
import { dialog, shell } from 'electron'
import { createChildWindow } from '../utils/electron'
import { readXlsx } from '../utils/xlsx'
import fs from 'fs'
import axios from 'axios'

class Sys {
  // 选择目录
  chooseDir() {
    const folderPath = dialog.showOpenDialogSync({
      properties: ['openDirectory']
    })
    if (folderPath) {
      return folderPath[0]
    }
    return ''
  }
  // 选择文件
  chooseFile({ params }) {
    const { accept = '.xlsx', multi = false } = params
    const properties = ['openFile']
    if (multi) {
      properties.push('multiSelections')
    }
    const filters = []
    const extensions = (Array.isArray(accept) ? accept : accept.split(',')).map((ext) =>
      ext.trim().replace(/^\./, '')
    )
    filters.push({
      name: '文件',
      extensions
    })
    const filePaths = dialog.showOpenDialogSync({
      properties,
      filters
    })
    if (filePaths) {
      if (multi) {
        return filePaths
      }
      return filePaths[0]
    }
    return multi ? [] : ''
  }
  // 打开文件
  async openDirOrFile({ params }) {
    const { path } = params
    if (!path) return false
    try {
      const exists = fs.existsSync(path)
      if (!exists) return false
      const stat = fs.statSync(path)
      if (stat.isDirectory()) {
        const res = await shell.openPath(path)
        return res === ''
      } else {
        shell.showItemInFolder(path)
        return true
      }
    } catch {
      const res = await shell.openPath(path)
      return res === ''
    }
  }
  // 打开新窗口
  openNewWindow({ params }) {
    const { routePath, title, screenWidth, screenHeight } = params
    createChildWindow(routePath || '/', {
      width: Math.round(screenWidth * 0.8),
      height: Math.round(screenHeight * 0.8),
      title: title || '电商工具箱'
    })
  }
  // 解析xlsx
  async parseXlsx({ params }) {
    const { filePath } = params
    if (!filePath) {
      return {
        status: 'error',
        message: '请选择文件'
      }
    }
    try {
      return {
        status: 'success',
        data: await readXlsx(filePath)
      }
    } catch (error) {
      return {
        status: 'error',
        message: error.message
      }
    }
  }
  // 链接展开
  async expandUrl({ params }) {
    const { url } = params
    if (!url) {
      return {
        status: 'error',
        message: '链接不能为空'
      }
    }
    try {
      const response = await axios.get(url, {
        maxRedirects: 10,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        validateStatus: (status) => status >= 200 && status < 400
      })
      // Node.js environment: response.request.res.responseUrl
      const finalUrl = response.request?.res?.responseUrl || url
      return {
        status: 'success',
        url: finalUrl
      }
    } catch (error) {
      console.error('expandUrl error', error)
      return {
        status: 'error',
        message: error.message,
        url: url
      }
    }
  }
}

export default new Sys()
