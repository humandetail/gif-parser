import type { ParsedImage, ParsedImageItem, RebuildOptions } from '../types'

export const rebuildGIF = ({ width, height, images, cycleIndex }: ParsedImage, opts: RebuildOptions = {}) => {
  const canvas = document.createElement('canvas')
  // @see https://html.spec.whatwg.org/multipage/canvas.html#dom-canvasrenderingcontext2dsettings-willreadfrequently
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  const { length: len } = images

  let haveBeenBuilt = false
  let currentCycleIndex = 0
  const maxCycleIndex = typeof opts.changeCycleIndex === 'function'
    ? opts.changeCycleIndex(cycleIndex)
    : cycleIndex

  const currentImages = typeof opts.changeImages === 'function'
    ? opts.changeImages(images)
    : images

  if (len <= 0) {
    throw new Error('No image data found.')
  }

  Object.assign(canvas, { width, height })

  let rId = 0
  let index = 0
  let startTime: number
  let currentFrame: ParsedImageItem = currentImages[index]
  let { delayTime } = currentFrame
  let isFirstDisplay = true

  function run () {
    rId = requestAnimationFrame(run)

    if (maxCycleIndex !== 0 && currentCycleIndex >= maxCycleIndex) {
      stop()
      return
    }

    const currentTime = performance.now()

    if (delayTime * 1000 / 100 <= currentTime - startTime) {
      if (index + 1 >= len) {
        index = 0
        currentCycleIndex++
      } else {
        index++
      }

      currentFrame = currentImages[index]
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
