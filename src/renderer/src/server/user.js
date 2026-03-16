import service from './index'

export const apiLogin = (params) => {
  return service({
    sid: '20001',
    datas: params
  })
}

export const apiRegister = (params) => {
  return service({
    sid: '20002',
    datas: params
  })
}

export const apiUpdatePasswordUser = (params) => {
  return service({
    sid: '20003',
    datas: params
  })
}

export const apiUpdatePermissionUser = (params) => {
  return service({
    sid: '20004',
    datas: params
  })
}

export const apiUserList = (params) => {
  return service({
    sid: '20005',
    datas: params
  })
}
