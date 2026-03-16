import ffmpeg from './index'

const ENCODER_PRIORITY = [
  'h264_nvenc', // NVIDIA
  'h264_qsv', // Intel QuickSync
  'h264_amf', // AMD
  'h264_videotoolbox' // macOS
]

let cachedEncoder = undefined

/**
 * 初始化并检测 GPU 编码器
 * 建议在应用启动时调用
 */
export const initGpuEncoder = async () => {
  if (cachedEncoder !== undefined) {
    return cachedEncoder
  }

  console.log('start check GPU encoder...')

  for (const codec of ENCODER_PRIORITY) {
    try {
      await checkEncoder(codec)
      cachedEncoder = codec
      return codec
    } catch (e) {
      console.error(`GPU encoder error`, e.message)
    }
  }

  console.log('没有可用的 GPU 编码器, use CPU.')
  cachedEncoder = null
  return null
}

/**
 * 获取当前已缓存的编码器
 * 必须在 initGpuEncoder 完成后调用，否则返回 null (默认 CPU)
 * @returns {string|null}
 */
export const getEncoder = () => {
  return cachedEncoder || null
}

/**
 * 测试编码器是否可用
 * 尝试编码 1 帧空白视频
 */
const checkEncoder = (codec) => {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input('color=c=black:s=1280x720')
      .inputFormat('lavfi')
      .outputFormat('null')
      .videoCodec(codec)
      .outputOptions('-pix_fmt yuv420p')
      .frames(1)
      .on('start', (commandLine) => {
        console.log(`Spawned Ffmpeg with command: ${commandLine}`)
      })
      .on('end', resolve)
      .on('error', (err, stdout, stderr) => {
        console.error(`Error checking codec ${codec}:`, err.message)
        if (stderr) console.error('ffmpeg stderr:', stderr)
        reject(err)
      })
      .save('NUL') // Windows 使用 NUL，Linux/Mac 使用 /dev/null
  })
}
