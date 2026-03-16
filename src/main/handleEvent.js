import Sys from './sys'
import Ui from './ui'
import VideoDeal from './video-deal'
import Config from './config/handle'
import DownloadVideo from './download-video'
import OnlineData from './online-data'

/**
 * 处理 handle 事件
 * @param {string} app 应用名称
 * @param {string} eventName 事件名称
 * @param {Object} params 参数
 * @param {Function} send 发送消息函数
 * @param {Object} config 全局配置
 */
const handleEvent = async ({ app, eventName, params = {}, send, config }) => {
  let res = {}
  try {
    let eventHandler = null
    switch (app) {
      case 'sys':
        eventHandler = Sys[eventName]
        if (eventHandler) {
          eventHandler = eventHandler.bind(Sys)
        }
        break
      case 'ui':
        eventHandler = Ui[eventName]
        if (eventHandler) {
          eventHandler = eventHandler.bind(Ui)
        }
        break
      case 'config':
        eventHandler = Config[eventName]
        if (eventHandler) {
          eventHandler = eventHandler.bind(Config)
        }
        break
      case 'video-deal':
        eventHandler = VideoDeal[eventName]
        if (eventHandler) {
          eventHandler = eventHandler.bind(VideoDeal)
        }
        break
      case 'download-video':
        eventHandler = DownloadVideo[eventName]
        if (eventHandler) {
          eventHandler = eventHandler.bind(DownloadVideo)
        }
        break
      case 'onlineData':
        eventHandler = OnlineData[eventName]
        if (eventHandler) {
          eventHandler = eventHandler.bind(OnlineData)
        }
        break
    }
    if (!eventHandler) {
      return {
        status: 'error',
        message: `应用 ${app} 不存在事件 ${eventName}`
      }
    }
    res = await eventHandler({
      params,
      send,
      config
    })
    return res
  } catch (error) {
    console.log('handleEvent error', error)
    res = {
      status: 'error',
      message: error.message
    }
    return res
  }
}

export default handleEvent
