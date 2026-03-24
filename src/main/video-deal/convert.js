/**
 * 视频处理相关
 */
import convertVideo from './convert'
import combineVideo from './combine'
import { getFileNameAndSuffix, getChoicePath, checkFilePath } from '../utils/sys'
import fs from 'fs'

class VideoDeal {
  // 裁剪
  async convert({ params, send }) {
    const { files, rootPath, resolution, taskId } = params
    let processMap = new Map()
    const concurrency = 3 // 并发数限制
    const executing = [] // 当前正在执行的任务

    // 初始化状态
    files.forEach((file) => processMap.set(file.url, 0))

    for (const file of files) {
      const p = Promise.resolve().then(async () => {
        try {
          const filePath = file.path
          const { fileName, suffix } = getFileNameAndSuffix(filePath)
          const saveFileName = checkFilePath(getChoicePath(rootPath), fileName, suffix)

          await convertVideo(
            filePath,
            saveFileName,
            resolution,
            (p) => {
              send('video:progress', { url: file.url, progress: p.percent })
              if (Math.round(p.percent) >= 100) {
                processMap.set(file.url, 1)
                send('video:complete', { url: file.url, savePath: saveFileName })
              }
            },
            {}
          )
        } catch (error) {
          processMap.set(file.url, 1) // 即使失败也标记为完成（处理过）
          console.error(`Error processing file ${file.url}:`, error)
          send('video:error', { url: file.url, error: error.message })
        } finally {
          // 检查所有任务是否完成
          const completeCount = [...processMap.values()].filter((status) => status === 1).length
          if (completeCount === files.length) {
            send('video-deal-complete', taskId)
          }
        }
      })

      executing.push(p)

      // 任务完成后从执行队列中移除
      const clean = () => executing.splice(executing.indexOf(p), 1)
      p.then(clean).catch(clean)

      // 如果达到并发限制，等待任意一个任务完成
      if (executing.length >= concurrency) {
        await Promise.race(executing)
      }
    }

    // 等待所有剩余任务完成
    await Promise.all(executing)
  }
  // 组合
  combine({ params, send }) {
    const { files, filesGroup = [], rootPath, taskId, merge = 'false' } = params
    const works = []
    if (filesGroup.length === 0) {
      // 没有分组，直接组合
      if (!merge || merge === 'false') {
        const videos = files.map((file) => file.path)
        const saveFileName = checkFilePath(getChoicePath(rootPath), '合并视频')
        const totalDuration = files.reduce((acc, file) => acc + (file.durationSec || 0), 0)
        works.push({
          videos,
          url: files[0].url,
          saveFileName,
          totalDuration
        })
      } else {
        // 将files进行全排列生成 合并视频-i
        const getPermutations = (arr) => {
          if (arr.length <= 1) return [arr]
          const result = []
          for (let i = 0; i < arr.length; i++) {
            const current = arr[i]
            const remaining = arr.slice(0, i).concat(arr.slice(i + 1))
            const remainingPermutations = getPermutations(remaining)
            for (const perm of remainingPermutations) {
              result.push([current].concat(perm))
            }
          }
          return result
        }

        const permutations = getPermutations(files)
        permutations.forEach((perm, index) => {
          const videos = perm.map((file) => file.path)
          const saveFileName = checkFilePath(getChoicePath(rootPath), `合并视频-${index + 1}`)
          const totalDuration = perm.reduce((acc, file) => acc + (file.durationSec || 0), 0)
          works.push({
            videos,
            url: perm[perm.length - 1].url,
            saveFileName,
            totalDuration
          })
        })
      }
    } else {
      // 将 files 内的视频与filesGroup 内的视频笛卡尔积组合
      /**
       * 笛卡尔积工具函数
       * @param {Array[]} arrays 需要组合的数组列表
       * @returns {Array[]} 组合后的数组列表
       */
      const cartesian = (arrays) => {
        return arrays.reduce((acc, curr) => acc.flatMap((x) => curr.map((y) => [...x, y])), [[]])
      }

      // 准备参与笛卡尔积的数组列表: files 是第一组，filesGroup 中的每一组也是独立的参与方
      const listsToCombine = [...filesGroup, files]

      const combinations = cartesian(listsToCombine)
      combinations.forEach((combination) => {
        const videos = combination.map((item) => item.path)
        // 计算总时长
        const totalDuration = combination.reduce((acc, item) => acc + (item.durationSec || 0), 0)
        // 生成文件名
        const fileNameStr = combination
          .map((item) => getFileNameAndSuffix(item.path).fileName)
          .join('X')
        const saveFileName = checkFilePath(getChoicePath(rootPath), fileNameStr)

        works.push({
          url: combination[combination.length - 1].url,
          videos,
          saveFileName,
          totalDuration
        })
      })
    }
    // 组合视频 - 使用并发控制
    const queue = [...works]
    const concurrency = 3

    // 启动并发处理
    const workers = []
    let completeCount = 0
    const totalCount = works.length
    /**
     * 视频处理工作器
     * 从队列中获取任务并执行，直到队列为空
     */
    const runWorker = async () => {
      while (queue.length > 0) {
        const work = queue.shift()
        if (!work) break
        const { videos, saveFileName, totalDuration, url } = work
        try {
          let isComplete = false
          await combineVideo(videos, saveFileName, totalDuration, (p) => {
            console.log(videos, 'combineVideo progress', p)
            send('video:progress', { url, progress: p.percent })
            if (Math.round(p.percent) >= 100 && !isComplete) {
              isComplete = true
              send('video:complete', { url, savePath: saveFileName })
              // 计算完成进度
              completeCount++
              if (completeCount === totalCount) {
                send('video-deal-complete', taskId)
              }
            }
          })
        } catch (error) {
          send('video:error', { url, error: error.message })
        }
      }
    }
    for (let i = 0; i < Math.min(concurrency, works.length); i++) {
      workers.push(runWorker())
    }
  }
  // 删除视频
  deleteVideo({ params, send }) {
    const { pathList, taskId } = params
    pathList.forEach((path) => {
      try {
        fs.unlinkSync(path)
        send('video:delete', { url: path, success: true })
      } catch (error) {
        send('video:delete', { url: path, success: false, error: error.message })
      }
    })
    send('video-deal-complete', taskId)
  }
}

export default new VideoDeal()
