import { decimal2Uint8Array, uint8Array2decimal } from './helper'

const createBitArray = (bytes: number[]) => {
  const bitArray: number[] = []

  for (let i = 0; i < bytes.length; i++) {
    bitArray.unshift(...decimal2Uint8Array(bytes[i]))
  }

  return bitArray
}

export const createBitReader = (sourceBytes: number[] = []) => {
  let bitsArray = createBitArray(sourceBytes)

  const readBits = (size: number) => {
    const temp: number[] = []

    if (size > bitsArray.length) {
      throw new RangeError('No more bit to read.')
    }

    let len = size

    while (len > 0) {
      temp.unshift(bitsArray.pop()!)
      len--
    }

    return uint8Array2decimal(temp)
  }

  const hasBits = (size = 1) => {
    if (size > 12) {
      throw new RangeError(`Size "${size}" out of range. (max size is 12)`)
    }

    return bitsArray.length >= size
  }

  const pushBytes = (sourceBytes: number[]) => {
    // 如果还有剩余的数据没读完，需要保留到下一轮读取
    bitsArray = [...createBitArray(sourceBytes), ...bitsArray]
  }

  return {
    readBits,
    hasBits,
    pushBytes
  }
}
