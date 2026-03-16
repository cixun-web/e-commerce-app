import { chromium } from 'playwright'
import { resolveExecutablePath, browserOptions, getUserDataDir, clearUserDataDir } from './utils.js'
import { pageOpt, transformDataSource } from './gen/page-opt.js'
import { writeXlsx } from '../utils/xlsx'
import { app } from 'electron'
import dayjs from 'dayjs'
import path from 'path'

class Ui {
  constructor(appName) {
    this.browser = null
    this.appName = appName
    this.groupIng = false
  }
  /**
   * 初始化浏览器实例
   * 尝试启动 Chrome，如果因为锁文件导致失败，尝试清理锁文件后重试
   * 防止重复初始化
   */
  async init() {
    // 如果浏览器实例已存在，直接返回
    if (this.browser) {
      return {
        status: 'failed',
        message: '浏览器实例已存在'
      }
    }
    // 如果正在初始化，等待初始化完成
    if (this.initPromise) {
      await this.initPromise
      return {
        status: 'failed',
        message: '浏览器实例正在初始化，等待...'
      }
    }
    // 开始初始化
    this.initPromise = (async () => {
      const executablePath = resolveExecutablePath()
      if (!executablePath) {
        throw new Error('没有找到可用的 Chromium 可执行文件路径')
      }
      const launchOptions = {
        ...browserOptions,
        executablePath
      }
      const userDataDir = getUserDataDir(this.appName)
      try {
        this.browser = await chromium.launchPersistentContext(userDataDir, launchOptions)
      } catch (err) {
        console.error('浏览器实例启动失败:', err)
        try {
          this.clearCache(this.appName)
          // 再次尝试启动
          console.log('再次尝试启动...')
          this.browser = await chromium.launchPersistentContext(userDataDir, launchOptions)
        } catch (retryErr) {
          console.error('Retry launch failed:', retryErr)
          throw retryErr
        }
      }
      this.browser.on('close', () => {
        this.close()
      })
    })()
    try {
      await this.initPromise
      return {
        status: 'success',
        message: '浏览器实例初始化成功'
      }
    } finally {
      this.initPromise = null
    }
  }
  clearCache() {
    clearUserDataDir(this.appName)
  }
  async close() {
    this.browser?.close()
    this.browser = null
  }
  // 运行配置
  async runCase({ params, send }) {
    const { e2e, groupId = -2 } = params
    if (!e2e || !e2e.steps || e2e.steps.length === 0) {
      send('e2e-logs', {
        level: 'error',
        message: '配置不能为空~'
      })
      throw new Error('配置不能为空')
    }
    const { steps, data_source } = e2e
    const caseId = e2e.uid || e2e.id
    await this.init()
    // 全局变量
    let globalVars = {}
    // 转换数据源
    const dataSource = transformDataSource(data_source)
    // 按步骤执行
    for (const step of steps) {
      const stepId = step.uid || step.id
      send('e2e-progress', { stepId, groupId, caseId, status: 'running' })
      send('e2e-logs', {
        level: 'info',
        message: step.name + '开始执行~'
      })
      try {
        const pages = this.browser.pages()
        let page = null
        if (pages.length > 0) {
          page = pages[pages.length - 1]
        }
        const resultVars = await pageOpt({ step, dataSource, page, globalVars, send })
        console.log(resultVars, 'resultVars')
        if (resultVars) {
          globalVars = {
            ...globalVars,
            ...resultVars
          }
        }
        send('e2e-progress', { stepId, groupId, caseId, status: 'success' })
      } catch (error) {
        send('e2e-logs', {
          level: 'danger',
          message: step.name + '执行失败===' + error.message
        })
        send('e2e-progress', {
          stepId,
          groupId,
          caseId,
          status: 'failed',
          errTip: error.message
        })
        // 终止for循环
        throw new Error(error)
      }
    }
    return {
      ...dataSource,
      ...globalVars
    }
  }
  // 运行分组
  async runGroup({ params, send }) {
    if (this.browser) {
      throw new Error('浏览器实例已存在, 请先关闭再运行')
    } else {
      this.groupIng = false
    }
    if (this.groupIng) {
      throw new Error('有任务正在运行中')
    }
    try {
      // 打开浏览器
      await this.init()
    } catch {
      throw new Error('浏览器实例初始化失败')
    }
    const { group } = params
    try {
      this.groupIng = true
      // 通知开始运行，清除之前的状态
      send('e2e-group-start', { groupId: group.id })
      send('e2e-logs', {
        level: 'info',
        message: group.name + '开始执行~'
      })
      for (const caseItem of group.cases) {
        if (caseItem.isDisabled) {
          send('e2e-logs', {
            level: 'warning',
            message: caseItem.name + '已禁用，跳过执行'
          })
          continue
        }
        try {
          const result = await this.runCase({
            params: {
              e2e: {
                ...caseItem,
                data_source: JSON.parse(caseItem.data_source),
                steps: JSON.parse(caseItem.steps)
              },
              groupId: group.id
            },
            send
          })
          const sysInfo = {
            流程名称: group.name,
            名称: caseItem.name,
            完成时间戳: dayjs().unix()
          }
          // 判断是否需要写入 Excel 文件
          if (result.xlsxData) {
            try {
              let dir = app.getPath('downloads')
              const naming_way = caseItem.naming_way || '$[流程名称]-$[名称]-$[完成时间戳]'
              let name = ''
              if (caseItem.download_url) {
                dir = caseItem.download_url
              }
              const namingWay = naming_way.split('-')
              namingWay.forEach((item) => {
                if (item.includes('${')) {
                  // 搜索值
                  const key = item.replace('${', '').replace('}', '')
                  name += result[key] || ''
                } else if (item.includes('$[')) {
                  // 分组信息
                  const key = item.replace('$[', '').replace(']', '')
                  name += sysInfo[key] || ''
                } else {
                  name += item || ''
                }
                name += '-'
                // 确保name的字符串是符合文件name命名规则的
                name = name.replace(/[\\/:*?"<>|]/g, '-')
              })
              // 移除最后一个 '-'
              name = name.slice(0, -1)
              send('e2e-logs', {
                level: 'info',
                message: '开始写入xlsx文件' + name + '.xlsx'
              })
              await writeXlsx(path.join(dir, name + '.xlsx'), result.xlsxData)
            } catch (err) {
              throw new Error('写入 Excel 文件失败' + err.message)
            }
          }
        } catch {
          // 结束本次执行
          continue
        }
      }
      send('e2e-logs', {
        level: 'success',
        message: group.name + '执行成功~'
      })
      await this.browser.close()
      this.groupIng = false
    } catch (err) {
      await this.browser.close()
      this.groupIng = false
      send('e2e-logs', {
        level: 'danger',
        message: group.name + '执行失败===' + err.message
      })
      throw new Error(err.message)
    }
  }
}

export default new Ui('automate')
