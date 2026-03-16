import * as uiUtils from '../utils/index'
import axios from 'axios'

/**
 * 获取浏览器用例详情
 * @param {Object} params 参数
 * @returns {Promise} axios promise
 */
const apiBrowserCaseDetail = async (params) => {
  const isDev = process.env.NODE_ENV === 'development'
  // const baseURL = isDev ? 'http://127.0.0.1:6767' : 'http://www.cixun.vip'
  const baseURL = 'http://www.cixun.vip'

  return axios.post(
    `${baseURL}/api/e_commerce`,
    {
      sid: '30004',
      datas: JSON.stringify(params)
    },
    {
      headers: {
        'Content-Type': 'application/json;charset=utf-8'
      }
    }
  )
}

/**
 * 执行页面操作
 * @param {Object} param0
 * @param {Object} param0.step 步骤信息
 * @param {Object} param0.page Playwright page对象
 * @param {Object} param0.dataSource 数据源
 * @param {Object} param0.globalVars 全局变量
 * @param {Function} param0.send 发送消息函数
 */
export const pageOpt = async ({ step, page, dataSource, globalVars, send }) => {
  // 调用接口获取模板
  try {
    const res = await apiBrowserCaseDetail({ id: step.id })
    const resData = res.data || {}
    if (resData.code === 0) {
      step.code = resData.data?.code || ''
    } else {
      throw new Error(`获取步骤模板失败: ${resData.data.message || '未知错误'}`)
    }
  } catch (error) {
    console.error('获取步骤模板失败:', error)
    throw new Error(`获取步骤模板失败: ${error.message}`)
  }
  let code = step.code
  // 移除不必要的转义符
  if (typeof code === 'string') {
    code = code.replace(/\\`/g, '`').replace(/\\\${/g, '${')
  }

  // 获取工具函数名和值
  const utilKeys = Object.keys(uiUtils)
  const utilValues = utilKeys.map((key) => uiUtils[key])

  const functionBody = 'return (async () => {\n' + code + '\n})()'
  // 将工具函数注入到执行上下文中
  const fn = new Function('step', 'page', 'dataSource', 'globalVars', 'send', ...utilKeys, functionBody)
  return await fn(step, page, dataSource, globalVars, send, ...utilValues)
}

/**
 * 将 dataSource 数组转换为键值对对象
 * 处理特殊逻辑：如果存在 child-{value} 且为数组，则将子项也加入结果，key 为 {parentLabel}-{childLabel}
 * @param {Array} dataSource 数据源数组
 * @returns {Object} 键值对对象
 */
export const transformDataSource = (dataSource) => {
  const result = {}
  if (!Array.isArray(dataSource)) {
    return result
  }

  dataSource.forEach((item) => {
    if (!item.label) return

    // 设置当前项的值
    result[item.label] = item.value

    // 检查是否有对应的子项配置
    const childKey = `child-${item.value}`
    if (item[childKey] && Array.isArray(item[childKey])) {
      item[childKey].forEach((child) => {
        if (child.label) {
          result[`${item.label}-${child.label}`] = child.value
        }
      })
    }
  })

  return result
}
