/**
 * 本地配置
 */
import { app } from 'electron'
import path from 'path'
import fs from 'fs'
import defaultConfig from './defaultConfig.json'
import { checkAndCreateDir, checkFile, readFilesInDir } from '../utils/sys'

// 每次更新软件可能需要同步的配置文件名
const syncConfigNames = Object.keys(defaultConfig)
class Config {
  constructor() {
    this.baseDir = path.join(app.getPath('userData'), 'config')
    console.log(this.baseDir, 'this.baseDir')
    this.configs = {}
    this.getConfigs()
  }
  /**
   * 获取所有配置
   * @returns {Object} 配置对象，键为配置文件名（不包含扩展名），值为配置内容
   */
  getConfigs() {
    checkAndCreateDir(this.baseDir)
    console.log(this.baseDir, 'this.baseDir')
    // 检查并初始化配置文件
    syncConfigNames.forEach((configName) => {
      const filePath = path.join(this.baseDir, `${configName}.json`)
      const hasFile = checkFile(filePath)
      if (!hasFile) {
        this.set(configName, defaultConfig[configName])
      }
    })
    // 读取baseDir下所有json文件
    const files = readFilesInDir(this.baseDir, '.json')
    const configs = {}
    files.forEach((file) => {
      try {
        const config = JSON.parse(fs.readFileSync(file))
        configs[path.basename(file, '.json')] = config
        // 处理需要同步的配置文件
        if (syncConfigNames.includes(path.basename(file, '.json'))) {
          const fileName = path.basename(file, '.json')
          const defaultJson = defaultConfig[fileName]
          Object.keys(defaultJson).forEach((key) => {
            if (!configs[fileName][key]) {
              configs[fileName][key] = defaultJson[key]
            }
          })
          this.set(fileName, configs[fileName])
        }
      } catch (error) {
        console.error(`读取配置文件 ${file} 失败: ${error.message}`)
      }
    })
    this.configs = configs
  }
  /**
   * 获取配置
   * @param {string} configName - 配置文件名（不包含扩展名）
   * @returns {Object} 配置内容
   */
  get(configName) {
    return this.configs[configName] || null
  }
  /**
   * 设置配置
   * @param {string} configName - 配置文件名（不包含扩展名）
   * @param {Object} config - 配置内容
   */
  set(configName, config) {
    const configFilePath = path.join(this.baseDir, `${configName}.json`)
    try {
      this.configs[configName] = JSON.parse(JSON.stringify(config))
      fs.writeFileSync(configFilePath, JSON.stringify(config, null, 2))
      return true
    } catch (error) {
      console.error(`写入配置文件 ${configFilePath} 失败: ${error.message}`)
      return false
    }
  }
}

export default new Config()
