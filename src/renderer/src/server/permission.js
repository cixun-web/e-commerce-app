import service from './index'

export const apiAddPermission = (params) => {
  return service({
    sid: '21001',
    datas: params
  })
}

export const apiPermissionList = (params) => {
  return service({
    sid: '21003',
    datas: params
  })
}
