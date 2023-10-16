<template>
  <section class="info-wrapper">
    <div ref="containerRef" class="container"></div>
  </section>
</template>

<script setup lang="ts">
import { inject, ref, watchEffect } from 'vue'
import type { ParsedImage, ParsedImageItem } from '@humandetail/gif-parser'

const data = inject('data', ref<ParsedImage | null>(null))
const containerRef = ref<HTMLDivElement | null>(null)

const draw = ({ delayTime, imageData }: ParsedImageItem, width = 0, height = 0) => {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!

  Object.assign(canvas, { width, height })

  ctx.putImageData(imageData, 0, 0)

  return {
    delayTime,
    canvas
  }
}

watchEffect(() => {
  if (data.value) {
    const list = data.value.images.map(image => {
      return draw(image, data.value?.width, data.value?.height)
    })
    if (containerRef.value) {
      containerRef.value.innerHTML = ''
      const oTable = document.createElement('table')

      oTable.style.cssText = 'width: 100%; border-collapse: collapse;'
      oTable.setAttribute('border', '1')

      oTable.innerHTML = `<thead><tr><th>序号</th><th>延时(ms)</th><th>图像</th></tr></thead>`
      const oTBody = document.createElement('tbody')

      list.forEach((item, index) => {
        const oTr = document.createElement('tr')
        oTr.appendChild(createTd(index + 1))
        oTr.appendChild(createTd(item.delayTime * 1000 / 100))
        oTr.appendChild(createTd(item.canvas))
        oTBody.appendChild(oTr)
      })

      oTable.appendChild(oTBody)
      containerRef.value.appendChild(oTable)
    }
  }
})

const createTd = (val: number | HTMLCanvasElement) => {
  const oTd = document.createElement('td')

  if (typeof val === 'number') {
    oTd.textContent = `${val}`
  } else {
    oTd.appendChild(val)
  }

  return oTd
}
</script>