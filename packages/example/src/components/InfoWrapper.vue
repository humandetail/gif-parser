<template>
  <section v-if="data" class="info-wrapper">
    <header class="header">
      <h2 class="title">
        帧动画
        <template v-if="!isEdit">
          <button
            class="btn"
            @click="isEdit = true"
          >
            编辑
          </button>
        </template>

        <template v-else>
          <button
            class="btn"
            @click="handleSave"
          >
            保存
          </button>
          <button
            class="btn"
            @click="isEdit = false"
          >
            取消
          </button>
        </template>
      </h2>
      <div class="operations">
        <label class="label" for="cycle-index-input">
          循环次数：
        </label>
        <input
          type="number"
          class="input"
          id="cycle-index-input"
          v-model="formData.cycleIndex"
          :disabled="!isEdit"
        />

        <button
          class="btn"
          :disabled="!isEdit"
          @click="handleBatchReverse"
        >
          批量反色
        </button>

        <label class="label" for="batch-change-delay-input">
          批修改延时：
        </label>
        <input
          type="number"
          class="input"
          id="batch-change-delay-input"
          :disabled="!isEdit"
          @change="handleBatchChangeDelayTime"
        />
      </div>
    </header>

    <table class="frames-table">
      <tbody>
        <tr>
          <td
            v-for="(item, index) of images"
            :key="item.id"
            class="frame"
          >
            <div class="image">
              <canvas-component
                :width="width"
                :height="height"
                :imageData="item.imageData"
                :is-reversed="formData.images[index].isReversed"
              />
            </div>

            <div class="extra">
              <button
                class="btn"
                :class="{
                  active: formData.images[index].isReversed
                }"
                :disabled="!isEdit"
                @click="formData.images[index].isReversed = !formData.images[index].isReversed"
              >
                反色
              </button>
              <div class="delay-time">
                <label :for="`delay-time-${index}`">
                  延时
                </label>
                <input
                  type="number"
                  class="input"
                  :id="`delay-time-${index}`"
                  v-model="formData.images[index].delayTime"
                  :disabled="!isEdit"
                />
                <span class="unit">ms</span>
              </div>
            </div>
          </td>
        </tr>
      </tbody>
    </table>

    <footer class="footer">
    </footer>
  </section>
</template>

<script setup lang="ts">
import { computed, inject, ref, watch } from 'vue'
import type { ParsedImage } from '@humandetail/gif-parser'

import CanvasComponent from './CanvasComponent.vue'

const data = inject('data', ref<ParsedImage | null>(null))

const images = computed(() => (data.value?.images ?? []).map(image => {
  return {
    ...image,
    id: Math.random().toString().slice(2) + Date.now()
  }
}))
const width = computed(() => data.value?.width ?? 0)
const height = computed(() => data.value?.height ?? 0)

const isEdit = ref(false)

const formData = ref<any>({
  cycleIndex: 0,
  images: []
})

const resetFormData = () => {
  formData.value = {
    cycleIndex: data.value?.cycleIndex ?? 0,
    images: images.value.map(image => {
      return {
        isReversed: false,
        delayTime: image.delayTime
      }
    })
  }
}

watch(data, () => {
  resetFormData()
}, {
  immediate: true,
  deep: true
})

const reverseImageData = (imageData: ImageData) => {
  for (let i = 0; i < imageData.data.length; i++) {
    if (i % 4 !== 3) {
      imageData.data[i] = 255 - imageData.data[i]
    }
  }
  return imageData
}

const handleBatchReverse = () => {
  formData.value.images = formData.value.images.map((image: any) => {
    return {
      ...image,
      isReversed: !image.isReversed
    }
  })
}

const handleBatchChangeDelayTime = (e: Event) => {
  const target = e.target as HTMLInputElement

  formData.value.images = formData.value.images.map((image: any) => {
    return {
      ...image,
      delayTime: Number(target.value)
    }
  })
}

const handleSave = () => {
  const cycleIndex = formData.value.cycleIndex
  data.value = {
    ...data.value,
    cycleIndex: Number.isNaN(Number(cycleIndex)) ? 0 : Math.max(0, Math.floor(cycleIndex)),
    images: images.value.map((image, index) => {
      const { delayTime, isReversed } = formData.value.images[index]
      return {
        ...image,
        delayTime: delayTime,
        imageData: isReversed ? reverseImageData(image.imageData) : image.imageData
      }
    })
  } as ParsedImage
  resetFormData()
  isEdit.value = false
}
</script>

<style lang="scss" scoped>
.info-wrapper {
  position: relative;
  width: 100%;
  overflow-x: auto;
  
  .frames-table {
    td {
      padding: 8px;
    }

    .image {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100px;
      height: 100px;
      padding: 10px;
      border: 1px solid #f1f1f1;

      :deep(canvas) {
        max-width: 100%;
        max-height: 100%;
      }
    }

    .extra {
      .btn {
        width: 100%;
        margin: 4px 0;

        &.active {
          background-color: #0088ff;
          color: #fff;
        }
      }

      .delay-time {
        display: flex;
        align-items: center;

        .input {
          flex: 1;
        }
      }
    }
  }


  .header,
  .footer {
    position: sticky;
    left: 0;
  }

  .btn {
    padding: 4px 8px;
    font-size: 14px;
  }

  .input {
    all: unset;
    width: 40px;
    margin: 2px;
    font-size: 12px;
    -moz-appearance: textfield;
    background-color: #f1f1f1;

    &::-webkit-outer-spin-button,
    &::-webkit-inner-spin-button {
      -webkit-appearance: none
    }

    &:disabled {
      background-color: transparent;
    }
  }

  .title,
  .operations {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
  }
}
</style>
