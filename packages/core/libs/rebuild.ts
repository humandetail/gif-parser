import type { ParsedImage, ParsedImageItem } from '../types'

export const rebuildGIF = ({ width, height, images }: ParsedImage) => {
  const canvas = document.createElement('canvas')
  const { length: len } = images

  let haveBeenBuilt = false

  if (len <= 0) {
    throw new Error('No image data found.')
  }

  Object.assign(canvas, { width, height })

  let rId = 0
  let index = 0
  let startTime: number
  let currentFrame: ParsedImageItem = images[index]
  let { delayTime } = currentFrame
  let isFirstDisplay = true

  function run () {
    rId = requestAnimationFrame(run)
    const currentTime = performance.now()

    if (delayTime * 1000 / 100 <= currentTime - startTime) {
      index = index + 1 >= len
        ? 0
        : index + 1

      currentFrame = images[index]
      delayTime = currentFrame.delayTime
      startTime = currentTime

      putImageData(canvas, currentFrame)
    } else if (isFirstDisplay) {
      putImageData(canvas, currentFrame)
      isFirstDisplay = false
    }
  }

  function stop () {
    cancelAnimationFrame(rId)
  }

  return {
    build () {
      if (haveBeenBuilt) {
        throw new Error('Please do not rebuild again.')
      }
      startTime = performance.now()
      run()
      haveBeenBuilt = true

      return canvas
    },

    destroy () {
      stop()
      haveBeenBuilt = false
    }
  }
}

const putImageData = (canvas: HTMLCanvasElement, currentFrame: ParsedImageItem) => {
  // @see https://html.spec.whatwg.org/multipage/canvas.html#dom-canvasrenderingcontext2dsettings-willreadfrequently
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  const {
    disposal,
    left,
    top,
    width,
    height,
    imageData
  } = currentFrame

  if (disposal === 2) {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  } else if (disposal === 1) {
    // 针对透明底色进行处理
    // 保留上一帧图片的数据
    replaceImageData(ctx, currentFrame)
  }

  ctx.putImageData(imageData, left, top, 0, 0, width, height)
}

const replaceImageData = (ctx: CanvasRenderingContext2D, {
  left,
  top,
  width,
  height,
  imageData
}: ParsedImageItem) => {
  const prevImageData = ctx.getImageData(left, top, width, height)
  const data = imageData.data
  const len = data.length

  for (let i = 0; i < len; i += 4) {
    const a = data[i + 3]

    if (a === 0) {
      data[i] = prevImageData.data[i]
      data[i + 1] = prevImageData.data[i + 1]
      data[i + 2] = prevImageData.data[i + 2]
      data[i + 3] = prevImageData.data[i + 3]
    }
  }
}
