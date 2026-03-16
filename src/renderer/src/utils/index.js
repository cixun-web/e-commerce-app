import dayjs from 'dayjs'

export const getUid = () => {
  return dayjs().unix()
}

export const copyToClipboard = async (text) => {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return
    } catch (err) {
      console.warn('Clipboard API failed, falling back to execCommand', err)
    }
  }

  // Fallback for older browsers or non-secure contexts
  const input = document.createElement('textarea') // Use textarea to preserve formatting
  input.value = text
  input.style.position = 'fixed' // Prevent scrolling to bottom
  input.style.opacity = '0'
  document.body.appendChild(input)
  input.select()
  try {
    document.execCommand('copy')
  } catch (err) {
    console.error('Fallback: Oops, unable to copy', err)
  }
  document.body.removeChild(input)
}

/**
 * 生成随机 UID，确保包含英文字符、数字和标点符号
 * @returns {string} 生成的随机 UID
 */
export const randomUid = () => {
  const letters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const numbers = '0123456789'
  const symbols = '!@#$%^&*()_+-=[]{}|;:\'",.<>/?'
  const allChars = letters + numbers + symbols
  const length = 10

  const uidArr = []

  // 确保每种类型至少有一个
  uidArr.push(letters.charAt(Math.floor(Math.random() * letters.length)))
  uidArr.push(numbers.charAt(Math.floor(Math.random() * numbers.length)))
  uidArr.push(symbols.charAt(Math.floor(Math.random() * symbols.length)))

  // 填充剩余长度
  for (let i = uidArr.length; i < length; i++) {
    uidArr.push(allChars.charAt(Math.floor(Math.random() * allChars.length)))
  }

  // 打乱顺序
  for (let i = uidArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[uidArr[i], uidArr[j]] = [uidArr[j], uidArr[i]]
  }

  return uidArr.join('')
}

export const clone = (obj) => {
  return JSON.parse(JSON.stringify(obj))
}
