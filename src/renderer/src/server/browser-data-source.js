import service from './index'

// 新增浏览器数据源
export const apiBrowserDataSourceAdd = (params) => {
  return service({
    sid: '31001',
    datas: params
  })
}

// 更新浏览器数据源
export const apiBrowserDataSourceUpdate = (params) => {
  return service({
    sid: '31002',
    datas: params
  })
}

// 查询浏览器数据源列表
export const apiBrowserDataSourceList = (params) => {
  return service({
    sid: '31003',
    datas: params
  })
}

// 查询浏览器数据源详情
export const apiBrowserDataSourceDetail = (params) => {
  return service({
    sid: '31004',
    datas: params
  })
}

// 删除浏览器数据源
export const apiBrowserDataSourceDelete = (params) => {
  return service({
    sid: '31005',
    datas: params
  })
}
