import { decompressLZW } from './libs/decompress'
import { readFile } from './libs/fileReader'
import { parseDataView } from './libs/parser'
import { rebuildGIF } from './libs/rebuild'
import { compress, buildImageFromBytes } from './libs/compress'

export type * from './types'

/**
 * 解析 GIF 图像
 * @param source - GIF 图像 URL 地址或者是一个 GIF 文件
 */
const parse = async (source: string | File) => {
  const dataView = await readFile(source)

  const graphicData = parseDataView(dataView)
  console.log(graphicData)
  return decompressLZW(graphicData)
}

export {
  rebuildGIF,
  parse,
  compress,
  buildImageFromBytes
}
