// 获取过滤数据
export const getFilterData = (allData, filterForm) => {
  return allData.filter((item) => {
    let isOk = true
    for (const header in filterForm) {
      const { type, value, inArr } = filterForm[header] || {}
      if (value && type.includes('number_')) {
        if (type === 'number_gte') {
          isOk = isOk && Number(item[header]) >= Number(value)
        } else if (type === 'number_lte') {
          isOk = isOk && Number(item[header]) <= Number(value)
        }
      } else if (type === 'text' && inArr && inArr.length > 0) {
        isOk = isOk && inArr.includes(item[header])
      } else if (type === 'not_text' && inArr && inArr.length > 0) {
        isOk = isOk && !inArr.includes(item[header])
      }
    }
    return isOk
  })
}

// 获取映射数据
export const getDownFormData = (allData, mapping) => {
  const result = []
  allData.forEach((item) => {
    const videoArr = (item[mapping.videoUrl] || '').split('，')
    videoArr.forEach((video) => {
      result.push({
        '数据类型': mapping.type || '',
        '数据表现': item[mapping.dataType] || '',
        '视频链接': video || ''
      })
    })
  })
  return result
}
