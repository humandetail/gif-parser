<template>
  <div class="container">
    <template-file />
    <custom-file />
    <div v-if="loading">Loading</div>
    <template v-else>
      <preview-wrapper />
      <info-wrapper />
    </template>
  </div>
</template>

<script setup lang="ts">
import { provide, ref, watch } from 'vue'
import { parse, type ParsedImage } from '@humandetail/gif-parser'

import TemplateFile from './components/TemplateFile.vue'
import CustomFile from './components/CustomFile.vue'
import PreviewWrapper from './components/PreviewWrapper.vue'
import InfoWrapper from './components/InfoWrapper.vue'

const currentFile = ref<string | File | null>(null)
const data = ref<ParsedImage | null>(null)

const loading = ref(false)

watch(currentFile, async () => {
  if (currentFile.value) {
    loading.value = true
    data.value = await parse(currentFile.value)
    loading.value = false
  }
})

provide('currentFile', currentFile)
provide('data', data)
</script>

