import ExcelJS from 'exceljs'

// 下载图片转 base64
const imgToBase64 = async (url) => {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`下载图片失败: ${url}`)
  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer).toString('base64')
}

// 读取 Excel 文件
export const readXlsx = async (filePath) => {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(filePath)
  const worksheet = workbook.worksheets[0]
  const rows = []
  worksheet.eachRow({ includeEmpty: true }, (row) => {
    const values = []
    row.eachCell({ includeEmpty: true }, (cell) => {
      const v = cell.value
      if (v === null || v === undefined) {
        values.push('')
        return
      }
      if (typeof v === 'object') {
        if (v.hyperlink) {
          values.push(v.hyperlink)
          return
        }
        if (Array.isArray(v.richText)) {
          values.push(v.richText.map((rt) => rt.text || '').join(''))
          return
        }
        if (typeof cell.text === 'string' && cell.text.length > 0) {
          values.push(cell.text)
          return
        }
        if (typeof v.text === 'string') {
          values.push(v.text)
          return
        }
        if (v.result !== undefined) {
          values.push(v.result)
          return
        }
        values.push(String(v))
        return
      }
      values.push(v)
    })
    const isEmptyRow = values.every((item) => String(item || '').trim() === '')
    if (!isEmptyRow) rows.push(values)
  })
  const imagesByCell = {}
  const imgs = typeof worksheet.getImages === 'function' ? worksheet.getImages() : []
  imgs.forEach((info) => {
    const img = workbook.getImage ? workbook.getImage(info.imageId) : null
    if (!img) return
    const ext = img.extension || 'png'
    let dataUrl = ''
    if (img.base64) {
      dataUrl = /^data:/.test(img.base64) ? img.base64 : `data:image/${ext};base64,${img.base64}`
    } else if (img.buffer) {
      const base64 = Buffer.from(img.buffer).toString('base64')
      dataUrl = `data:image/${ext};base64,${base64}`
    }
    const tl = info.range && info.range.tl
    if (tl && typeof tl.row === 'number' && typeof tl.col === 'number') {
      const key = `${tl.row}-${tl.col + 1}`
      imagesByCell[key] = dataUrl
    }
  })
  const imgCellIndexs = Object.keys(imagesByCell)
  if (imgCellIndexs && imgCellIndexs.length > 0) {
    imgCellIndexs.forEach((key) => {
      const [row, col] = key.split('-')
      rows[Number(row)][Number(col) - 1] = imagesByCell[key]
    })
  }
  return rows
}

// 写入 Excel 文件
/**
 * 写入 Excel 文件，支持自动下载并嵌入图片
 * @param {string} filePath - 保存路径
 * @param {Array<Array<string|number>>} data - 数据源
 */
export const writeXlsx = async (filePath, data) => {
  try {
    // 确保有数据可写入
    if (!data || data.length === 0) {
      throw new Error('没有数据可写入Excel文件')
    }

    const BASE64_PREFIX = '###IMAGE_BASE64###'

    // 识别带【图】的表头列索引
    const imageColIndices = new Set()
    if (data.length > 0) {
      const headerRow = data[0]
      for (let j = 0; j < headerRow.length; j++) {
        const header = headerRow[j]
        if (typeof header === 'string' && header.includes('【图】')) {
          imageColIndices.add(j)
        }
      }
    }

    // 处理数据源，如果存在图片则需要将其下载替换成base64资源
    // 从第二行开始遍历（跳过表头）
    for (let i = 1; i < data.length; i++) {
      const row = data[i]
      // 只处理标记为图片的列
      for (const j of imageColIndices) {
        // 防止行数据长度不足
        if (j >= row.length) continue

        const cell = row[j]
        if (typeof cell === 'string' && cell.startsWith('http')) {
          try {
            // 不再检测 content-type，直接下载
            const imgBase64 = await imgToBase64(cell)
            row[j] = BASE64_PREFIX + imgBase64
          } catch (err) {
            console.error('图片下载失败:', cell, err)
          }
        }
      }
    }

    // 写入 Excel 文件
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Sheet1')

    // 写入数据
    data.forEach((row) => {
      worksheet.addRow(row)
    })

    // 遍历单元格，处理图片
    worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
      // 设置默认行高，避免图片太挤，表头（第一行）不需要设置
      if (rowNumber > 1) {
        row.height = 80
      }
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        // 设置默认列宽
        const column = worksheet.getColumn(colNumber)
        if (!column.width || column.width < 15) {
          column.width = 15
        }

        let base64 = ''
        let ext = 'png'

        if (typeof cell.value === 'string') {
          if (cell.value.startsWith(BASE64_PREFIX)) {
            base64 = cell.value.replace(BASE64_PREFIX, '')
          } else if (cell.value.startsWith('data:image')) {
            const matches = cell.value.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/)
            if (matches) {
              ext = matches[1]
              base64 = matches[2]
            }
          }
        }

        if (base64) {
          const buffer = Buffer.from(base64, 'base64')

          const imageId = workbook.addImage({
            buffer,
            extension: ext
          })

          // 将图片嵌入到单元格
          // tl: Top Left, br: Bottom Right
          // col/row 都是 0-based 索引
          worksheet.addImage(imageId, {
            tl: { col: colNumber - 1, row: rowNumber - 1 },
            br: { col: colNumber, row: rowNumber }
          })

          // 清除单元格的文本内容
          cell.value = ''
        }
      })
    })

    await workbook.xlsx.writeFile(filePath)
  } catch (err) {
    throw new Error('写入 Excel 文件失败: ' + err.message)
  }
}
