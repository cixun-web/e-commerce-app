import ffmpeg from '../ffmpeg'
import { getEncoder } from '../ffmpeg/gpu-manager'

/**
 * 视频转换函数
 * @param {string} inputPath 输入文件路径
 * @param {string} outputPath 输出文件路径
 * @param {string} resolution 分辨率，格式如 "1080x1920"
 * @param {function} callback 转换进度回调函数
 * @returns {Promise<string>} 转换完成后的输出路径
 */
const convertVideo = (inputPath, outputPath, resolution, callback) => {
  if (!inputPath) {
    return Promise.reject(new Error('Input path is required'))
  }

  // 规范化分辨率字符串，将全角或特殊字符的乘号替换为小写 x
  // 同时也处理可能出现的奇怪字符（如错误日志中的 脳，可能是编码问题导致的 × 变体）
  let normalizedResolution = resolution || '1080x1920'
  normalizedResolution = normalizedResolution.replace(/[×*脳]/g, 'x')

  return new Promise((resolve, reject) => {
    try {
      const videoCodec = getEncoder() || 'libx264'
      console.log(videoCodec, 'videoCodec')
      ffmpeg(inputPath)
        .videoCodec(videoCodec)
        .size(normalizedResolution) // 保持比例，不足加黑边
        .outputOptions('-pix_fmt yuv420p') // 确保输出为 yuv420p 格式，兼容大多数播放器
        .on('progress', (p) => {
          console.log(p, 'p')
          callback(p)
        })
        .on('error', (err, stdout, stderr) => {
          console.error(`Error converting video:`, err.message)
          if (stderr) console.error('ffmpeg stderr:', stderr)
          reject(err)
        })
        .on('end', () => {
          console.log('视频转换完成')
          callback({ percent: 100 })
          resolve(outputPath)
        })
        .save(outputPath)
    } catch (err) {
      reject(err)
    }
  })
}

export default convertVideo
