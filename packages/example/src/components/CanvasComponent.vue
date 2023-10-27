<template>
  <canvas
    ref="canvasRef"
    :width="width"
    :height="height"
  ></canvas>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'

const props = defineProps<{
  width: number
  height: number
  imageData: ImageData
  isReversed: boolean
}>()

const canvasRef = ref<HTMLCanvasElement>()

onMounted(() => {
  if (canvasRef.value) {
    const ctx = canvasRef.value.getContext('2d', { willReadFrequently: true })!

    ctx.putImageData(props.imageData, 0, 0)
  }
})

watch(() => props.isReversed, () => {
  if (canvasRef.value) {
    const ctx = canvasRef.value.getContext('2d', { willReadFrequently: true })!

    const imageData = ctx.getImageData(0, 0, props.width, props.height)

    for (let i = 0; i < imageData.data.length; i++) {
      if (i % 4 !== 3) {
        imageData.data[i] = 255 - imageData.data[i]
      }
    }

    ctx.putImageData(imageData, 0, 0)
  }
})
</script>
