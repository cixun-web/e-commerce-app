import service from './index'

export const apiGoodsList = (params) => {
  return service({
    sid: '11001',
    datas: params
  })
}

export const apiGoodsLog = (params) => {
  return service({
    sid: '11002',
    datas: params
  })
}
