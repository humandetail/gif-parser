export type RGB = [number, number, number]
export type RGBA = [...RGB, number]

export type SubBlocks = number[]

export interface LogicalScreenDescriptor {
  width: number
  height: number
  globalColorTableFlag: boolean,
  /**
   * 原始图像可用的每种原色的位数减 1。
   * 该值表示从中选择图形中颜色的整个调色板的大小，
   * 而不是图形中实际使用的颜色数。
   * 例如，如果此字段中的值为 3，则原始图像的调色板每个原色有 4 位可用于创建图像。
   * 该值应设置为指示原始调色板的丰富度，即使整个调色板中的每种颜色在源计算机上不可用
   */
  colorResolution: number,
  /**
   * 指示全局颜色表是否已排序。
   * 如果设置了该标志，则全局颜色表将按照重要性递减的顺序进行排序。
   * 通常，顺序是频率递减，最常见的颜色排在第一位。
   * 这有助于解码器在可用颜色较少的情况下选择最佳的颜色子集；
   * 解码器可以使用表的初始段来呈现图形。
   *
   * - 0: 没有排序
   * - 1: 已排序
   */
  sortFlag: number,
  /**
   * 全局颜色表长度: size
   * @example
   * ```js
   * // 如果该值是 3
   * const size = 3
   * // 那么全局颜色表的真实长度应该是
   * const actual = 2 ** (size + 1)
   * // 2 << size
   * ```
   */
  sizeOfGlobalColorTable: number,
  /**
   * 背景颜色在全局颜色表中的索引。
   * 背景颜色是用于屏幕上未被图像覆盖的像素的颜色。
   * 如果全局颜色表标志设置为（零），则该字段应为零且应被忽略。
   */
  backgroundColorIndex: number,
  /**
   * 用于计算原始图像中像素长宽比的近似值的因子。
   * 如果该字段的值不为 0，则根据以下公式计算长宽比的近似值：
   * `长宽比 =（像素长宽比 + 15）/ 64`
   *
   * 像素长宽比定义为像素宽度除以高度的商。
   * 该字段中的值范围允许以 1/64 的增量指定最宽像素 4:1 到最高像素 1:4。
   */
  pixelAspectRatio: number
}

interface Extension {
  introducer: number
  label: number
  size?: number
  terminator: number
}

export interface ApplicationExtension extends Extension {
  identifier: string[]
  authCode: string[]
  data: SubBlocks[]
  // 指示图像动画的循环次数，0 表示永远循环
  cycleIndex: number
}

export interface CommentExtension extends Extension {
  comment: string,
}

/** 图形控制扩展块 */
export interface GraphicControlExtension extends Extension {
  reserved: number
  /**
   * 指示图形在显示后的处理方式
   *
   * - 0: 没有指定处理，解码器无需做任何操作
   * - 1: 不要处置，图形要留在原处
   * - 2: 恢复为背景色，图形所使用的区域必须还原为背景色
   * - 3: 恢复到以前，需要解码器来恢复被图形覆盖的区域，该区域在呈现图形之前存在
   * - 4-7: 预留值
   */
  disposal: number
  /**
   * 指示在继续之前是否需要用户输入。
   * 如果设置了该标志，则在输入用户输入时将继续处理。
   * 用户输入的性质由应用程序决定(回车、点击鼠标按钮等)。
   */
  userInput: boolean
  /**
   * 指示是否在透明索引字段中给定透明索引。(此字段是字节的最低有效位。)
   *
   * - 0: 没有给出透明索引
   * - 1: 有给出透明索引
   */
  transparencyFlag: boolean
  /**
   * 如果不为0，该字段指定在继续处理数据流之前等待的百分之一秒数。
   * 在图形渲染后，立即开始计时。
   * 此字段可以与用户输入标志字段一起使用。
   */
  delayTime: number
  /**
   * 透明度索引是这样的：
   * 当遇到透明度索引时，显示设备的相应像素不会被修改，并且处理继续到下一个像素。
   * 当且仅当透明度标志设置为1时，索引才会出现。
   */
  transparencyIndex: number
}

export interface PlainTextExtension extends Extension {
  gridLeft: number
  gridTop: number
  gridWidth: number
  gridHeight: number
  cellWidth: number
  cellHeight: number
  foregroundColorIndex: number
  backgroundColorIndex: number
  data: SubBlocks[]
}

export interface ImageDescriptor {
  separator: number
  left: number
  top: number
  width: number
  height: number
  /** 指示紧随该图像描述符之后存在局部颜色表 */
  localColorTableFlag: boolean
  /** 指示图像是否隔行扫描，图像以四通道交错模式交错 */
  interlaced: boolean
  colorSorted: boolean
  reserved: number
  localColorTableSize: number
}

export interface ImageBytes {
  graphicControlExtension: GraphicControlExtension | null
  data: null | {
    minCodeSize: number
    terminator: number,
    subBlocks: SubBlocks[]
  },
  plainTextExtension: PlainTextExtension | null
  imageDescriptor: ImageDescriptor | null
  localColorTable: RGB[] | null
}

export interface GraphicData {
  header: string[]
  logicalScreenDescriptor: LogicalScreenDescriptor | null
  globalColorTable: RGB[] | null
  commentExtension: CommentExtension | null
  applicationExtension: ApplicationExtension | null
  images: ImageBytes[]
  trailer?: number
}

export interface Context {
  data: DataView
  offset: number
  readonly hasBytes: boolean
  advance: (offset: number) => void
  consume: () => number
  getValue: (size: number) => number[]
  graphicData: GraphicData
}

export interface CodeUnitItem {
  stream: number[]
  table: number[][]
}

export interface ParsedImageItem {
  left: number
  top: number
  width: number
  height: number
  disposal: number
  delayTime: number
  transparencyFlag: boolean
  transparencyIndex: number
  imageData: ImageData
}

export interface ParsedImage {
  width: number
  height: number
  bgColor: RGB | null
  images: ParsedImageItem[],
  cycleIndex: number
}

export interface RebuildOptions {
  changeCycleIndex?: (cycleIndex: number) => number
  changeImages?: (images: ParsedImageItem[]) => ParsedImageItem[]
}
