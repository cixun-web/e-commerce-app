import axios from 'axios'
import fs from 'fs'
import { app } from 'electron'
import ffmpeg from '../ffmpeg'
import { checkFilePath } from '../utils/sys'

class DownloadVideo {
  constructor() {
    this.downloading = false
  }
  // 下载单个视频
  async downVideo({ params, send }) {
    const { url, filename, downloadDir: customDownloadDir } = params
    // 确保下载目录存在
    let downloadDir = customDownloadDir
    if (!downloadDir || downloadDir === 'downloads') {
      downloadDir = app.getPath('downloads')
    } else if (downloadDir === 'desktop') {
      downloadDir = app.getPath('desktop')
    } else if (downloadDir === 'videos') {
      downloadDir = app.getPath('videos')
    }

    if (!fs.existsSync(downloadDir)) {
      fs.mkdirSync(downloadDir, { recursive: true })
    }
    // 简单处理文件名，避免非法字符，且加上后缀（假设是mp4，实际应从content-type判断）
    const safeFilename = filename.replace(/[\\/:*?"<>|]/g, '_')
    // const savePath = path.join(downloadDir, `${safeFilename}.mp4`)

    try {
      const response = await axios({
        method: 'get',
        url: url,
        responseType: 'stream'
      })

      const totalLength = response.headers['content-length']
      if (totalLength) {
        send('video:info', { url, size: totalLength })
      }
      let downloadedLength = 0
      const savePath = checkFilePath(downloadDir, `${safeFilename}`)
      const writer = fs.createWriteStream(savePath)
      response.data.pipe(writer)

      response.data.on('data', (chunk) => {
        downloadedLength += chunk.length
        if (totalLength) {
          const progress = (downloadedLength / totalLength) * 100
          send('video:progress', { url, progress })
        }
      })

      return new Promise((resolve, reject) => {
        writer.on('finish', () => {
          send('video:progress', { url, progress: 100 })
          // 获取视频元数据
          ffmpeg.ffprobe(savePath, (err, metadata) => {
            if (err) {
              console.error(`Error probing file ${savePath}:`, err)
              send('video:complete', { url, savePath })
            } else {
              const { duration } = metadata.format
              // 查找视频流以获取尺寸
              const videoStream = metadata.streams.find((s) => s.codec_type === 'video')
              const width = videoStream ? videoStream.width : 0
              const height = videoStream ? videoStream.height : 0
              // 格式化时长为 HH:MM:SS
              const formattedDuration = new Date(duration * 1000).toISOString().substr(11, 8)

              send('video:complete', {
                url,
                savePath,
                duration: formattedDuration,
                width,
                height,
                size: totalLength || metadata.format.size // 再次确保发送大小
              })
            }
            resolve()
          })
        })
        writer.on('error', (err) => {
          console.error(`Error writing file ${savePath}:`, err)
          reject(err)
        })
      })
    } catch (error) {
      console.error(`Error downloading ${url}:`, error)
      // 可以选择不抛出错误，以免中断整个队列，或者记录错误状态
    }
  }
  async downVideoList({ params, send }) {
    const { videoList, downloadDir } = params
    // 并发控制，限制最大并发数
    const pool = []
    const maxPoolNum = 10
    for (const item of videoList) {
      const task = this.downVideo({
        params: { url: item.url, filename: item.filename, downloadDir },
        send
      })
      const promise = task.then(() => {
        pool.splice(pool.indexOf(promise), 1)
      })
      pool.push(promise)
      if (pool.length >= maxPoolNum) {
        await Promise.race(pool)
      }
    }
    await Promise.all(pool)
  }
  // 整体文件下载处理
  async download({ params, send }) {
    const { videoColumn, naming_way, headerList, dataList, downloadDir } = params
    const uIndex = headerList.findIndex((item) => item === videoColumn)
    if (uIndex === -1) {
      throw new Error('视频列不存在')
    }
    const namingWay = naming_way.split('-')
    const namingList = []
    namingWay.forEach((item) => {
      if (item.includes('${')) {
        // 搜索值
        const key = item.replace('${', '').replace('}', '')
        const index = headerList.findIndex((item) => item === key)
        if (index === -1) {
          namingList.push('')
        } else {
          namingList.push(index)
        }
      } else {
        namingList.push(item)
      }
    })
    const videoList = dataList.map((item) => {
      let filename = ''
      namingList.forEach((naming) => {
        if (typeof naming === 'number') {
          filename += item[naming] || ''
        } else {
          filename += naming
        }
        filename += '-'
      })
      filename = filename.slice(0, -1)
      return {
        url: item[uIndex],
        filename,
        name: filename // 增加 name 字段适配 VideoCard
      }
    })

    // 异步执行下载，不阻塞返回列表
    this.downVideoList({
      params: { videoList, downloadDir },
      send
    }).catch((err) => {
      console.error('Batch download error:', err)
    })

    return videoList
  }
}

export default new DownloadVideo()
