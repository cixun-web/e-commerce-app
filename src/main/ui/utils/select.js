// 下拉单选
export const selectOne = () => {}

/**
 * 下拉多选
 * @param {*} el 入口元素
 * @param {*} dataList 数据列表
 * @param {*} type 类型 default 直接点击一次，select 保证选中， re-select 清空并选中
 */
export const selectMany = async (page, el, dataList, type = 'default') => {
  if (type === 're-select') {
    // 清空
    const closeIconsCount = await el.locator('.el-icon-close').count()
    for (let i = closeIconsCount - 1; i >= 0; i--) {
      await el.locator('.el-icon-close').nth(i).click()
    }
  }
  await el.click()
  for (let label of dataList) {
    let item
    if (label.includes('nth(')) {
      const index = parseInt(label.match(/nth\((\d+)\)/)[1])
      item = await page.getByRole('listitem').nth(index)
    } else {
      item = page.getByRole('listitem').filter({ hasText: new RegExp(`^${label}$`) })
    }
    if (type === 'select') {
      // 选确认item是否已经被选中
      const classAttr = await item.getAttribute('class')
      const isSelected = classAttr.includes('selected') || false
      console.log(label + ' 是否选中：' + isSelected)
      if (!isSelected) {
        await item.click()
      }
    } else {
      await item.click()
    }
  }
  // 主动让下拉消失
  await el.click()
}
