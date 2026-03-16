// main/ffmpeg.js
import ffmpegPath from '@ffmpeg-installer/ffmpeg'
import ffprobePath from '@ffprobe-installer/ffprobe'
import ffmpeg from 'fluent-ffmpeg'
import { app } from 'electron'

// 区分开发和生产环境路径
const isPackaged = app.isPackaged

let ffmpegBinary = ffmpegPath.path
let ffprobeBinary = ffprobePath.path

if (isPackaged) {
  ffmpegBinary = ffmpegBinary.replace('app.asar', 'app.asar.unpacked')
  ffprobeBinary = ffprobeBinary.replace('app.asar', 'app.asar.unpacked')
}

ffmpeg.setFfmpegPath(ffmpegBinary)
ffmpeg.setFfprobePath(ffprobeBinary)

export default ffmpeg
