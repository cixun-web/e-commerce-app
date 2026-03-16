import ffmpeg from '../ffmpeg'
import { getEncoder } from '../ffmpeg/gpu-manager'

/**
 * 将时间标记转换为秒
 * @param {string} timeMark 时间标记 (HH:MM:SS.mm)
 * @returns {number} 秒数
 */
const timeMarkToSeconds = (timeMark) => {
  if (typeof timeMark === 'number') return timeMark
  if (!timeMark) return 0
  const parts = timeMark.split(':')
  let seconds = 0
  if (parts.length === 3) {
    seconds += parseFloat(parts[0]) * 3600
    seconds += parseFloat(parts[1]) * 60
    seconds += parseFloat(parts[2])
  }
  return seconds
}

/**
 * 视频转换函数
 * @param {string[]} inputFiles 输入文件路径数组
 * @param {string} outPath 输出文件路径
 * @param {string} totalDuration 视频总时长，格式如 "00:00:00.00"
 * @param {function} callback 转换进度回调函数
 * @returns {Promise<string>} 转换完成后的输出路径
 */
const combineVideo = (inputFiles, outPath, totalDuration, callback) => {
  if (!inputFiles || inputFiles.length < 2) {
    return Promise.reject(new Error('至少输入 2 个视频文件'))
  }

  return new Promise((resolve, reject) => {
    const command = ffmpeg()

    inputFiles.forEach((file) => {
      command.input(file)
    })

    const videoCodec = getEncoder()
    if (videoCodec) {
      // 使用自动检测到的 GPU 编码器
      command.outputOptions(['-c:v', videoCodec])
    }

    command
      .videoBitrate('9800k')
      .audioBitrate('192k')
      .fps(30) // === 新增增强滤镜 ===
      .on('progress', (progress) => {
        if (totalDuration > 0) {
          const currentSeconds = timeMarkToSeconds(progress.timemark)
          // 重新计算百分比，确保不超过 99%（给完成留一点空间）
          let percent = (currentSeconds / totalDuration) * 100
          if (percent > 99) percent = 99
          progress.percent = percent
        }
        console.log(progress.percent, 'progress', totalDuration)
        callback(progress)
      })
      .on('error', (err) => {
        reject(err)
      })
      .on('end', () => {
        console.log('视频合并完成')
        callback({ percent: 100 })
        resolve(outPath)
      })
      .mergeToFile(outPath)
  })
}

export default combineVideo
