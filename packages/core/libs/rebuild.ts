import type { ParsedImage, ParsedImageItem } from '../types'

export const rebuildGIF = ({ width, height, images }: ParsedImage) => {
  const canvas = document.createElement('canvas')
  // @see https://html.spec.whatwg.org/multipage/canvas.html#dom-canvasrenderingcontext2dsettings-willreadfrequently
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
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

      ctx.putImageData(currentFrame.imageData, 0, 0)
    } else if (isFirstDisplay) {
      ctx.putImageData(currentFrame.imageData, 0, 0)
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
