import { createBitReader } from './bitReader'
import type { CodeUnitItem, GraphicData, ImageDescriptor, ParsedImage, ParsedImageItem, RGB } from '../types'

export const decompressLZW = (data: GraphicData): ParsedImage => {
  const {
    globalColorTable,
    logicalScreenDescriptor
  } = data

  const {
    globalColorTableFlag,
    width,
    height,
    backgroundColorIndex
  } = logicalScreenDescriptor || {}

  // 获取当前颜色的背景色
  const bgColor = globalColorTableFlag
    ? globalColorTable![backgroundColorIndex!]
    : null

  // 初始化 canvas, 用于生成 imageData
  const canvas = document.createElement('canvas')

  Object.assign(canvas, { width, height })

  const images = data.images.map<ParsedImageItem>(image => {
    const {
      localColorTable,
      imageDescriptor,
      graphicControlExtension,
      data
    } = image

    const { subBlocks = [], minCodeSize = 2 } = data || {}
    const {
      localColorTableFlag,
      left,
      top,
      width: w,
      height: h
    } = imageDescriptor || {}

    const {
      disposal,
      delayTime,
      transparencyFlag,
      transparencyIndex
    } = graphicControlExtension || {}

    const colorTable = (localColorTableFlag
      ? localColorTable
      : globalColorTableFlag
        ? globalColorTable
        : []
    ) ?? []

    // 解析成索引流
    const indexStream = readSubBlocks(subBlocks, minCodeSize)
    // 解析成图像数据
    const imageData = transfer2imageData(
      canvas,
      indexStream,
      colorTable,
      imageDescriptor,
      transparencyFlag ? transparencyIndex : -1,
      disposal
    )

    return {
      left: left || 0,
      top: top || 0,
      width: w || 0,
      height: h || 0,
      disposal: disposal || 0,
      delayTime: delayTime || 0,
      transparencyFlag: !!transparencyFlag,
      transparencyIndex: transparencyIndex || 0,
      imageData
    }
  })

  return {
    width: width || 0,
    height: height || 0,
    bgColor,
    images
  }
}

const readSubBlocks = (blocks: number[][], minCodeSize: number) => {
  const br = createBitReader()
  const indexStream: number[] = []
  const codeUnits: CodeUnitItem[] = []
  let codeStream: CodeUnitItem['stream'] = []
  let codeTable: CodeUnitItem['table'] = []

  // clearCode 2 ** minCodeSize
  // => 2 * 2 ^ (minCodeSize - 1)
  const clearCode = 2 << (minCodeSize - 1)
  const eoiCode = clearCode + 1

  let lastCode = eoiCode
  // firstCodeSize
  let size = minCodeSize + 1
  let growCode = (2 << size - 1) - 1

  let isInitialized = false

  init()

  blocks.forEach(block => {
    br.pushBytes(block)
    while (br.hasBits(size)) {
      // 让 `CODE` 成为 code stream 中的第一个代码
      const code = br.readBits(size)

      if (code === eoiCode) {
        codeStream.push(code)
        break
      } else if (code === clearCode) {
        // 当遇到 clearCode 时，开启新一个单元的解析
        init()
      } else if (!isInitialized) {
        // 输出 `{CODE}` 到 index stream
        indexStream.push(...codeTable[code])
        isInitialized = true
      } else {
        let k = 0

        const prevCode = codeStream.at(-1)!

        // 判断：`CODE` 在 code table 中
        if (code <= lastCode) {
          // 输出 `{CODE}` 到 index stream
          indexStream.push(...codeTable[code])
          // 设 K 为 `{CODE}` 中的第一个索引
          k = codeTable[code][0]
        } else {
          // 设 K 是 `{PREV CODE}` 的第一个索引
          k = codeTable[prevCode][0]
          // 输出 `{PREV CODE} + K` 到 index stream
          indexStream.push(...codeTable[prevCode], k)
        }

        // 最大代码是 12，当代码表中放置了 #4095 值之后，需要重置代码表计数
        if (lastCode < 0xFFF) {
          lastCode += 1
          // 添加 `{PREV CODE} + K` 到 code table
          codeTable[lastCode] = [...codeTable[prevCode], k]
          if (lastCode === growCode && lastCode < 0xFFF) {
            size += 1
            growCode = (2 << size - 1) - 1
          }
        }
      }
      codeStream.push(code)
    }
  })

  function init () {
    codeUnits.push({ stream: [], table: [] })
    codeStream = codeUnits[codeUnits.length - 1].stream
    codeTable = codeUnits[codeUnits.length - 1]!.table
    // 填充 codeTable
    for (let i = 0; i <= eoiCode; i++) {
      codeTable[i] = (i < clearCode) ? [i] : []
    }
    // 重置数据
    lastCode = eoiCode
    size = minCodeSize + 1
    growCode = (2 << size - 1) - 1
    isInitialized = false
  }

  return indexStream
}

const transfer2imageData = (
  canvas: HTMLCanvasElement,
  indexStream: number[],
  colorTable: RGB[],
  imageDescriptor: ImageDescriptor | null,
  transparencyIndex = -1,
  disposal = 0
) => {
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!

  // 恢复为背景色，图形所使用的区域必须还原为背景色
  if (disposal === 2) {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  const {
    left = 0,
    top = 0,
    width = 0,
    height = 0
  } = imageDescriptor || {}

  const imageData = ctx.getImageData(left, top, width, height)
  const { data } = imageData

  indexStream.forEach((item, index) => {
    // 当前像素为透明时，跳过并处理下一个像素
    if (item !== transparencyIndex) {
      const [r, g, b, a = 255] = colorTable[item]
      data[index * 4] = r
      data[index * 4 + 1] = g
      data[index * 4 + 2] = b
      data[index * 4 + 3] = a
    }
  })

  ctx.putImageData(imageData, left, top, 0, 0, width, height)

  return ctx.getImageData(0, 0, canvas.width, canvas.height)
}
