import service from './index'

// 新增浏览器用例组
export const apiBrowserCaseAdd = (params) => {
  return service({
    sid: '32001',
    datas: params
  })
}

// 更新浏览器用例组
export const apiBrowserCaseUpdate = (params) => {
  return service({
    sid: '32002',
    datas: params
  })
}

// 查询浏览器用例组列表
export const apiBrowserCaseList = (params) => {
  return service({
    sid: '32003',
    datas: params
  })
}

// 查询浏览器用例组详情
export const apiBrowserCaseDetail = (params) => {
  return service({
    sid: '32004',
    datas: params
  })
}

// 删除浏览器用例组
export const apiBrowserCaseDelete = (params) => {
  return service({
    sid: '32005',
    datas: params
  })
}
