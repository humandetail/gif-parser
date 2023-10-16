<template>
  <section class="custom-file-container">
    <ul class="list">
      <li class="item">
        <label class="label" for="upload">上传：</label>
        <input
          class="input"
          type="file"
          except="image/gif"
          id="upload"
          @input="handleInput"
        />
      </li>
      <li class="item">
        <label class="label" for="remote">远程图片：</label>
        <input
          class="input"
          type="url"
          id="remote"
          @input="handleInput"
        />
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { inject, ref } from 'vue'

const currentFile = inject('currentFile', ref<string | File | null>(null))

const handleInput = (e: Event) => {
  const target = e.target as HTMLInputElement

  if (!!target.files?.length) {
    currentFile.value = target.files[0]
  } else {
    currentFile.value = target.value
  }
}
</script>

<style lang="scss" scoped>

.custom-file-container {
  border: 4px solid #333;
  padding: 16px 32px;

  .list {
    display: flex;
    align-items: center;
    gap: 32px;

    .item {
      display: inline-flex;
      align-items: center;
      padding: 8px;
    }
  }
}
</style>
