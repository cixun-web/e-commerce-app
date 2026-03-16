import service from './index'

// 新增浏览器模板
export const apiBrowserTemplateAdd = (params) => {
  return service({
    sid: '30001',
    datas: params
  })
}

// 更新浏览器模板
export const apiBrowserTemplateUpdate = (params) => {
  return service({
    sid: '30002',
    datas: params
  })
}

// 查询浏览器模板列表
export const apiBrowserTemplateList = (params) => {
  return service({
    sid: '30003',
    datas: params
  })
}

// 查询浏览器模板详情
export const apiBrowserTemplateDetail = (params) => {
  return service({
    sid: '30004',
    datas: params
  })
}

// 删除浏览器模板
export const apiBrowserTemplateDelete = (params) => {
  return service({
    sid: '30005',
    datas: params
  })
}
