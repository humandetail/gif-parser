import { computedSize, packedRGB } from './helper'
import type { Context, SubBlocks } from '../types'

const createContext = (dataView: DataView): Context => {
  return {
    data: dataView,
    offset: 0,

    get hasBytes () {
      return this.data.byteLength > this.offset
    },

    advance (offset: number) {
      this.offset += offset
    },

    consume () {
      const val = this.data.getUint8(this.offset)
      this.advance(1)
      return val
    },

    getValue (size: number) {
      const data = []

      while (size > 0 && this.hasBytes) {
        data.push(this.consume())
        size--
      }

      return data
    },

    graphicData: {
      header: [],
      logicalScreenDescriptor: null,
      globalColorTable: null,
      applicationExtension: null,
      commentExtension: null,
      images: []
    }
  }
}

/**
 * 解析 dataView 数据
 */
export const parseDataView = (dataView: DataView) => {
  const context = createContext(dataView)

  // 头部数据
  parseHeader(context)

  // 逻辑描述符
  parseLogicalScreenDescriptor(context)

  // 全局颜色表
  parseGlobalColorTable(context)

  let isNewImage = true

  // 主体数据解析
  while (context.hasBytes) {
    const introducer = context.consume()
    if (isNewImage && introducer !== 0x3B) {
      context.graphicData.images.push({
        data: null,
        graphicControlExtension: null,
        imageDescriptor: null,
        plainTextExtension: null,
        localColorTable: null
      })

      isNewImage = false
    }

    switch (introducer) {
      case 0x21:
        // 扩展块都以 0x21 开始
        // eslint-disable-next-line no-case-declarations
        const label = context.consume()

        switch (label) {
          case 0xFF:
            // 应用扩展块
            parseApplicationExtension(context, introducer, label)
            break
          case 0xFE:
            // 备注扩展块
            parseCommentExtension(context, introducer, label)
            break
          case 0xF9:
            // 图形控制扩展块
            parseGraphicControlExtension(context, introducer, label)
            break
          case 0x01:
            // 文本扩展块
            parsePlainTextExtension(context, introducer, label)
            break
          default:
            throw new Error('Failure to parse.')
        }
        break
      case 0x2C:
        // 0x2C 表示图像描述符开始 -> [当前图片的颜色表] -> 图片数据
        parseImageData(context, introducer)
        // 解析完一张图像后，开始下一张图像
        isNewImage = true
        break
      case 0x3B:
        // 结束符
        context.graphicData.trailer = introducer
        break
      default:
        throw new Error('Failure to parse.')
    }
  }

  return context.graphicData
}

/**
 * 解析 GIF 头部信息
 * @returns ['G', 'I', 'F', '8', '7', 'a'] | ['G', 'I', 'F', '8', '9', 'a']
 */
const parseHeader = (context: Context) => {
  const header = context.getValue(6)

  if (
    header[0] !== 0x47 ||
    header[1] !== 0x49 ||
    header[2] !== 0x46 ||
    header[3] !== 0x38 ||
    ![0x39, 0x37].includes(header[4]) ||
    header[5] !== 0x61
  ) {
    throw new Error('Failure to parse. It\'s not a standard GIF file.')
  }

  context.graphicData.header = header.map(val => String.fromCodePoint(val))
}

const parseLogicalScreenDescriptor = (context: Context) => {
  const width = computedSize(context.consume(), context.consume())
  const height = computedSize(context.consume(), context.consume())

  // 解析打包位
  const packed = context.consume()

  // 全局颜色表标志，如为1则表示有全局颜色表
  const globalColorTableFlag = (packed & 0x80) > 0
  /**
   * 色彩分辨率 001表示2位/像素;111代表8位/像素
   * @todo
   * @see https://baike.baidu.com/item/%E8%89%B2%E6%B7%B1/2195505?fr=ge_ala
   */
  // const colorResolution = (packed & 0x70) >> 4
  const colorResolution = (packed & 0x70)
  // 排序标志
  // 如果值为1，则全局颜色表中的颜色按照“重要性降低”的顺序进行排序，
  // 这通常意味着图像中的“频率降低”。这可以帮助图像解码器，但不是必需的。
  const sortFlag = (packed & 0x08) >> 3
  // 全局颜色表长度 2 ^ (N + 1)
  const sizeOfGlobalColorTable = 2 << (packed & 0x07)
  // 背景颜色的索引，它只有在全局颜色表标记为1时有效。
  // 它表示全局颜色表中的颜色(通过指定其索引)应该用于图像数据中未指定值的像素。
  // 如果没有全局颜色表，这个字节应该是0。
  const backgroundColorIndex = context.consume()
  // 如果在这个字节中指定了一个值 N，那么对于所有的N !==0，实际使用的比率将是(N + 15) / 64。
  const pixelAspectRatio = context.consume()

  context.graphicData.logicalScreenDescriptor = {
    width,
    height,
    globalColorTableFlag,
    colorResolution,
    sortFlag,
    sizeOfGlobalColorTable,
    backgroundColorIndex,
    pixelAspectRatio: pixelAspectRatio === 0
      ? 0
      : (pixelAspectRatio + 15) / 64
  }
}

const parseGlobalColorTable = (context: Context) => {
  if (context.graphicData.logicalScreenDescriptor?.globalColorTableFlag) {
    const colorData = context.getValue(3 * context.graphicData.logicalScreenDescriptor.sizeOfGlobalColorTable)
    context.graphicData.globalColorTable = packedRGB(colorData)
  }
}

const parseApplicationExtension = (context: Context, introducer: number, label: number) => {
  const size = context.consume()
  const identifier = context.getValue(8)
  const authCode = context.getValue(3)
  const data: SubBlocks[] = []

  let subDataSize = context.consume()
  while (subDataSize !== 0x00) {
    data.push(context.getValue(subDataSize))
    subDataSize = context.consume()
  }

  // 看起来似乎只有一个 block 是在指示着动画应该循环几次
  // 所以只取第 0 项
  let cycleIndex = 0
  if (data.length > 0) {
    const [, t0, t1] = data[0]
    cycleIndex = computedSize(t0, t1)
  }

  const terminator = subDataSize

  if (terminator !== 0) {
    throw new Error(`Terminator parse error: ${terminator}`)
  }

  context.graphicData.applicationExtension = {
    introducer,
    label,
    size,
    identifier: identifier.map(item => String.fromCodePoint(item)),
    authCode: authCode.map(item => String.fromCodePoint(item)),
    data,
    cycleIndex,
    terminator: 0
  }
}

const parseCommentExtension = (context: Context, introducer: number, label: number) => {
  const data: SubBlocks[] = []

  let subBlocksSize = context.consume()
  while (subBlocksSize !== 0x00) {
    data.push(context.getValue(subBlocksSize))
    subBlocksSize = context.consume()
  }

  const comment = data.reduce((acc: string[], item) => {
    return acc.concat(item.slice(1).map(val => String.fromCodePoint(val)))
  }, []).join('')

  const terminator = subBlocksSize

  if (terminator !== 0) {
    throw new Error(`Terminator parse error: ${terminator}`)
  }

  context.graphicData.commentExtension = {
    introducer,
    label,
    comment,
    terminator: 0
  }
}

const parseGraphicControlExtension = (context: Context, introducer: number, label: number) => {
  const size = context.consume()

  const packed = context.consume()
  const reserved = (packed & 0xE0) >> 5
  const disposal = (packed & 0x1C) >> 2
  const userInput = (packed & 0x02) >> 1 > 0
  const transparencyFlag = (packed & 0x01) > 0

  const delayTime = computedSize(context.consume(), context.consume())

  const transparencyIndex = context.consume()
  const terminator = context.consume()

  if (terminator !== 0) {
    throw new Error(`Terminator parse error: ${terminator}`)
  }

  const lastImage = context.graphicData.images.at(-1)!

  lastImage.graphicControlExtension = {
    introducer,
    label,
    size,
    reserved,
    disposal,
    userInput,
    transparencyFlag,
    delayTime,
    transparencyIndex,
    terminator
  }
}

const parsePlainTextExtension = (context: Context, introducer: number, label: number) => {
  const size = context.consume()

  const [l0, l1, t0, t1, w0, w1, h0, h1] = context.getValue(8)

  const gridLeft = computedSize(l0, l1)
  const gridTop = computedSize(t0, t1)
  const gridWidth = computedSize(w0, w1)
  const gridHeight = computedSize(h0, h1)

  const cellWidth = context.consume()
  const cellHeight = context.consume()
  const foregroundColorIndex = context.consume()
  const backgroundColorIndex = context.consume()

  const data: SubBlocks[] = []

  let subDataSize = context.consume()
  while (subDataSize !== 0x00) {
    data.push(context.getValue(subDataSize))
    subDataSize = context.consume()
  }

  const terminator = subDataSize

  if (terminator !== 0) {
    throw new Error(`Terminator parse error: ${terminator}`)
  }

  const lastImage = context.graphicData.images.at(-1)!

  lastImage.plainTextExtension = {
    introducer,
    label,
    size,
    gridLeft,
    gridTop,
    gridWidth,
    gridHeight,
    cellWidth,
    cellHeight,
    foregroundColorIndex,
    backgroundColorIndex,
    data,
    terminator
  }
}

const parseImageData = (context: Context, separator: number) => {
  parseImageDescription(context, separator)
  parseLocalColorTable(context)
  parseImageSubData(context)
}

const parseImageDescription = (context: Context, separator: number) => {
  const left = computedSize(context.consume(), context.consume())
  const top = computedSize(context.consume(), context.consume())
  const width = computedSize(context.consume(), context.consume())
  const height = computedSize(context.consume(), context.consume())

  const packed = context.consume()
  const localColorTableFlag = (packed & 0x80) > 0
  const interlaced = (packed & 0x40) >> 6 > 0
  const colorSorted = (packed & 0x20) >> 5 > 0
  const reserved = (packed & 0x18) >> 3
  const localColorTableSize = 2 << (packed & 0x07)

  const lastImage = context.graphicData.images.at(-1)!

  lastImage.imageDescriptor = {
    separator,
    left,
    top,
    width,
    height,
    localColorTableFlag,
    interlaced,
    colorSorted,
    reserved,
    localColorTableSize
  }
}

const parseLocalColorTable = (context: Context) => {
  const lastImage = context.graphicData.images.at(-1)!

  const { localColorTableFlag, localColorTableSize } = lastImage.imageDescriptor || {}

  if (localColorTableFlag) {
    const colorData = context.getValue(3 * localColorTableSize!)

    lastImage.localColorTable = packedRGB(colorData)
  }
}

const parseImageSubData = (context: Context) => {
  const lastImage = context.graphicData.images.at(-1)!
  const minCodeSize = context.consume()
  const subBlocks = []

  let byte = context.consume()

  while (byte !== 0) {
    subBlocks.push(context.getValue(byte))
    byte = context.consume()
  }

  lastImage.data = {
    minCodeSize,
    terminator: byte,
    subBlocks
  }
}
