<template>
  <section class="template-container">
    <ul class="list">
      <li
        v-for="img of imgs"
        :key="img"
        class="item"
        :class="{
          current: currentFile === img
        }"
        @click="handelSelect(img)"
      >
        <img
          :src="img"
          :alt="img"
          width="50"
        />
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { inject, ref } from 'vue'

const basePath = import.meta.env.VITE_APP_PATHNAME

const imgs = [
  `${basePath}imgs/1.gif`,
  `${basePath}imgs/2.gif`,
  `${basePath}imgs/3.gif`
]

const currentFile = inject('currentFile', ref<string | File | null>(null))

const handelSelect = (img: string) => {
  currentFile.value = img
}
</script>

<style lang="scss" scoped>
.template-container {
  border: 4px solid #333;
  padding: 16px 32px;

  .list {
    display: flex;
    gap: 32px;

    .item {
      display: inline-flex;
      justify-content: center;
      align-items: center;
      padding: 8px;
      border: 2px solid transparent;
      cursor: pointer;

      &.current {
        border-color: #0088cc;
      }
    }
  }
}
</style>
