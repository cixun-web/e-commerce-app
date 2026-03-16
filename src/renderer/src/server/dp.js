import service from './index'

export const apiDpAdd = (params) => {
  return service({
    sid: '10001',
    datas: params
  })
}

export const apiDpList = (params) => {
  return service({
    sid: '10002',
    datas: params
  })
}

export const apiDpZhuaQu = (params) => {
  return service({
    sid: params.platform === 'xhs' ? '10003' : '10004',
    datas: params
  })
}

export const apiDpDelete = (params) => {
  return service({
    sid: '10998',
    datas: params
  })
}
