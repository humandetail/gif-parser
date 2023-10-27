<template>
  <section class="preview-wrapper" style="margin-top: 16px;">
    <div ref="containerRef" class="container"></div>
  </section>
</template>

<script setup lang="ts">
import { inject, ref, watchEffect } from 'vue'
import { type ParsedImage, rebuildGIF } from '@humandetail/gif-parser'

const data = inject('data', ref<ParsedImage | null>(null))
const containerRef = ref<HTMLDivElement | null>(null)

let destroy = () => {}

watchEffect(() => {
  if (data.value) {
    destroy()

    const action = rebuildGIF(data.value, {
      // changeCycleIndex: () => 1,
      // changeImages: (images) => images.map(image => {
      //   image.delayTime = 50
      //   return image
      // })
    })

    const canvas = action.build()
    destroy = action.destroy

    if (containerRef.value) {
      containerRef.value.innerHTML = ''
      containerRef.value.appendChild(canvas)
    }

  }
})
</script>