/**
 * 暴露给前台的api
 */
class ConfigHandle {
  // 获取配置
  getConfig({ params, config }) {
    const { configName } = params
    return config.get(configName)
  }
  setConfig({ params, config }) {
    const { configName, value } = params
    config.set(configName, value)
  }
}

export default new ConfigHandle()
