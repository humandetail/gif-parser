import { RGB } from '../types'

/**
 * 十进制转十六进制
 * @param { number } num - [0,255]
 */
export const decimal2hex = (num: number) => Math.min(255, Math.max(0, num))
  .toString(16)
  .padStart(2, '0')

/**
 * 十六进制转十进制
 * @param { string } hex - length: [1,2]
 */
export const hex2decimal = (hex: string) => Math.min(255, Math.max(0, parseInt(hex, 16)))

export const uint8Array2decimal = (arr: Uint8Array | number[]) =>
  (arr as number[]).reduce((acc, val, index, source) =>
    acc + (
      val === 1
        ? 2 ** (source.length - 1 - index)
        : 0
    )
  , 0)

export const decimal2Uint8Array = (num: number, size = 8) => {
  const arr = new Uint8Array(size)

  let len = size - 1
  while (num > 0) {
    arr[len--] = num % 2
    num = num / 2 >> 0
  }

  return arr
}

export const packedRGB = (colorList: number[]) => colorList.reduce((acc, item) => {
  let last = acc.at(-1)
  if (!last || last.length === 3) {
    last = [] as unknown as RGB
    acc.push(last)
  }

  last.push(item)

  return acc
}, [] as RGB[])

export const computedSize = (num1: number, num2: number) => num2 * 255 + num1 + num2
