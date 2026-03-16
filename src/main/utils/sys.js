import fs from 'fs'
import path from 'path'
import { app } from 'electron'

// 校验文件目录，不存在则创建
export const checkAndCreateDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
}

// 检测文件是否存在
export const checkFile = (filePath) => {
  // 校验文件 path 存在
  if (fs.existsSync(filePath)) {
    // 存在但是是目录，删除目录
    if (fs.statSync(filePath).isDirectory()) {
      fs.rmSync(filePath, { recursive: true, force: true })
      return false
    }
    return true
  } else {
    return false
  }
}

// 读取目录下指定后缀文件
export const readFilesInDir = (dirPath, suffix) => {
  const files = fs.readdirSync(dirPath)
  const result = []
  files.forEach((file) => {
    if (path.extname(file) === suffix) {
      result.push(path.join(dirPath, file))
    }
  })
  return result
}

// 根据文件路径返回文件名和后缀
export const getFileNameAndSuffix = (filePath) => {
  const fileName = path.basename(filePath, path.extname(filePath))
  const suffix = path.extname(filePath)
  return { fileName, suffix }
}

// 处理用户选择的路径，确保是有效路径
export const getChoicePath = (path) => {
  if (['downloads', 'videos', 'desktop'].includes(path)) {
    return app.getPath(path)
  }
  return path || 'downloads'
}

/**
 * 检查并生成唯一文件路径，存在则追加递增后缀
 * @param folderPath 保存目录
 * @param fileName 基础文件名（不含扩展名）
 * @param suffix 文件扩展名，默认 '.mp4'
 * @param index 递增后缀计数
 */
export const checkFilePath = (folderPath, fileName, suffix = '.mp4', index = 0) => {
  const _filePath = path.join(folderPath, fileName) + (index > 0 ? `-${index}` : '') + suffix
  if (fs.existsSync(_filePath)) {
    return checkFilePath(folderPath, fileName, suffix, index + 1)
  }
  return _filePath
}
