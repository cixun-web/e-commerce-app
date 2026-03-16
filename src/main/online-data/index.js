import { dialog } from 'electron'
import { readXlsx, writeXlsx } from '../utils/xlsx'
import path from 'path'

class OnlineData {
  constructor() {
    this.appName = 'onlineData'
  }
  async getDownDir({ config }) {
    return config.get('onlineData')?.downloadUrl || ''
  }
  // 设置下载目录
  async setDownDir({ params, config }) {
    const { downDir } = params
    const _value = config.get('onlineData') || {}
    _value.downloadUrl = downDir
    config.set('onlineData', _value)
    return { status: 'success', message: '设置成功' }
  }
  // 获取单条xlsx数据 row数据
  async getOneXlsxRow(filePath) {
    const rows = await readXlsx(filePath)
    const headers = (rows[0] || []).map((v) => String(v ?? '').trim())
    const body = rows.slice(1)
    const list = body.map((vals, idx) => {
      const obj = { __rowNum: idx + 2 }
      headers.forEach((h, ci) => {
        obj[h] = vals?.[ci] ?? ''
      })
      return obj
    })
    return list
  }
  async uploadXlsx() {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
      filters: [{ name: 'Excel Files', extensions: ['xlsx'] }]
    })
    if (canceled) {
      return { status: 'error', message: '已取消' }
    }
    // 将 filePaths 转换为 list
    const list = await Promise.all(
      filePaths.map(async (filePath) => {
        return await this.getOneXlsxRow(filePath)
      })
    )
    const allKey = []
    list.forEach((item) => {
      allKey.push(...Object.keys(item[0] || {}))
    })
    // 对allKey去重
    const headers = [...new Set(allKey)]
    // 去掉 __rowNum
    if (headers.includes('__rowNum')) {
      headers.splice(headers.indexOf('__rowNum'), 1)
    }
    const rows = list.flatMap((item) => item)
    return { status: 'success', message: '导入成功', data: { headers, rows } }
  }
  // 下载xlsx
  async downloadXlsx({ params, config }) {
    const { headers, rows, filename } = params
    const filePath = path.join(await this.getDownDir({ config }), `${filename}.xlsx`)

    const data = [headers]
    rows.forEach((row) => {
      const rowData = headers.map((header) => row[header] ?? '')
      data.push(rowData)
    })
    await writeXlsx(filePath, data)
    return filePath
  }
}

export default new OnlineData()
