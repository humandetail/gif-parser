import { ImageBytes, SubData } from '../types'
import { decimal2Uint8Array, uint8Array2decimal } from './helper'

interface CodeTable {
  code: number
  value: Array<number | string>
}

interface CodeUnit {
  codeStream: number[]
  codeTable: CodeTable[]
}

interface CompressContext {
  data: number[]
  index: number
  isEnd: () => boolean
  read: () => number
  firstCodeSize: number
  codeUnits: CodeUnit[]
  increase: () => void
  reset: () => void
  bitTemp: number[]
  readonly codeStream: number[]
  readonly codeTable: CodeTable[]

}

const createContext = (indexStream: number[], minCodeSize: number): CompressContext => {
  return {
    data: indexStream,
    index: 0,
    isEnd () {
      return this.index >= this.data.length
    },
    read () {
      return this.data[this.index++]
    },
    firstCodeSize: minCodeSize + 1,
    codeUnits: [
      { codeStream: [], codeTable: initCodeTable(minCodeSize) }
    ],
    increase () {
      this.firstCodeSize++
    },
    reset () {
      // 重置 code stream、code table 和最小代码
      this.firstCodeSize = minCodeSize + 1

      this.codeUnits.push({
        codeStream: [],
        codeTable: initCodeTable(minCodeSize)
      })
    },
    // 收集 bit 数据，之后组装成 bytes
    bitTemp: [],
    get codeStream () {
      return this.codeUnits.at(-1)!.codeStream
    },
    get codeTable () {
      return this.codeUnits.at(-1)!.codeTable
    }
  }
}

const initCodeTable = (minCodeSize: number) => {
  const clearCode = 2 ** minCodeSize
  const table = []

  for (let i = 0; i < clearCode; i++) {
    table.push({
      code: i,
      value: [i]
    })
  }

  table.push({
    code: clearCode,
    value: ['Clear Code']
  }, {
    code: clearCode + 1,
    value: ['EOI']
  })

  return table
}

const isInCodeTable = (value: CodeTable['value'], codeTable: CodeTable[]) => {
  return !!codeTable.find(item => item.value.join(',') === value.join(','))
}

const pushCodeTable = (value: CodeTable['value'], codeTable: CodeTable[]) => {
  const lastCode = codeTable.at(-1)!.code

  codeTable.push({
    code: lastCode + 1,
    value
  })

  return lastCode + 1
}

const getCodeByIndexBuffer = (indexBuffer: number[], codeTable: CodeTable[]) => {
  const item = codeTable.find(item => item.value.join(',') === indexBuffer.join(','))

  if (!item) {
    throw new Error(`The code of the Index Buffer in the code table cannot be found: ${indexBuffer.join(',')}`)
  }

  return item.code
}

const pushCode = (code: number, context: CompressContext) => {
  context.codeStream.push(code)
  context.bitTemp.unshift(...decimal2Uint8Array(code, context.firstCodeSize))
}

const packedBytes = (bitArray: number[], minCodeSize: number) => {
  const bytes: number[] = []

  const temp = []
  let idx = bitArray.length - 1

  const result = []

  while (idx >= 0) {
    if (temp.length === 8) {
      pushBytes((uint8Array2decimal(temp)))
      temp.length = 0
    }

    temp.unshift(bitArray[idx--])
  }

  if (temp.length !== 0) {
    pushBytes((uint8Array2decimal(temp)))
  }

  function pushBytes (byte: number) {
    bytes.push(byte)

    if (bytes.length >= 255 - 1) {
      result.push(255 - 1, ...bytes)
      bytes.length = 0
    }
  }

  if (bytes.length > 0) {
    result.push(bytes.length, ...bytes)
  }

  return [minCodeSize, ...result, 0]
}

export const buildImageFromBytes = (bytes: number[]): ImageBytes['data'] => {
  const minCodeSize = bytes[0]
  const terminator = bytes.at(-1)!

  const val = bytes.slice(1, -1)

  let len = val.shift()!
  const subData: SubData[] = []
  while (len > 0) {
    subData.push(val.splice(0, len))
    len = val.shift()!
  }

  return {
    minCodeSize,
    subData,
    terminator
  }
}

export const compress = (indexStream: number[], minCodeSize: number) => {
  const context = createContext(indexStream, minCodeSize)
  let indexBuffer = []
  let k

  let isInitialized = true

  // 2. 输出 Clear Code 到 Code Stream 中
  pushCode(2 ** minCodeSize, context)
  // 3. 从 Index Stream 中读取第一个值，并把它放到 Index Buffer 里面；
  indexBuffer.push(context.read())

  while (!context.isEnd()) {
    if (!isInitialized) {
      // 重置 code stream、code table 和最小代码，如同开启一张新的图片
      context.reset()

      isInitialized = true
    } else {
      // 5. 从 Index Stream 中读取下一个值，命名为 K
      k = context.read()

      // 6. Index Buffer 和 K 组成的值是否在 Code Table 中
      if (isInCodeTable([...indexBuffer, k], context.codeTable)) {
        // 6.1.1. 把 K 放到 Index Buffer 后面
        indexBuffer.push(k)
      } else {
        // 6.2.1. Code Table 新增一行数据，code 自增，value 为 Index Buffer + K
        const lastCode = pushCodeTable([...indexBuffer, k], context.codeTable)
        // 6.2.2. 将 Index Buffer 中的代码输出到 Code Stream
        pushCode(getCodeByIndexBuffer(indexBuffer, context.codeTable), context)
        // 6.2.3. Index Buffer 设置为 K
        indexBuffer = [k]
        // 6.2.4. K 设置为 null
        k = null

        // 当 code table 增加 4096 时，需要重置 Code Table、Code Stream 和 firstCodeSize
        // 并且发出一个 clear code 到代码表
        if (lastCode > 0xFFF) {
          isInitialized = false

          pushCode(2 ** minCodeSize, context)
        }
        // 当 code table 增加了一个大于或等于 2 ^ firstCodeSize 的值时
        // 需要多一个位来存储数据
        if (lastCode >= 2 ** context.firstCodeSize) {
          context.increase()
        }
      }
    }
  }

  // 8. 输出 Index Buffer 中的内容到 Code Stream
  pushCode(getCodeByIndexBuffer(indexBuffer, context.codeTable), context)
  // 9. 输出 End of Information Code 到 Code Stream
  pushCode(2 ** minCodeSize + 1, context)

  return packedBytes(context.bitTemp, minCodeSize)
}
