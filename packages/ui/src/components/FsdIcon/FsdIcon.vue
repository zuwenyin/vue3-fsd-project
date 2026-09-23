<script setup lang="ts">
import { computed, watch, type Component } from 'vue'
import * as IconSet from '@element-plus/icons-vue'

defineOptions({ name: 'FsdIcon' })

const props = defineProps<{
  name?: string
  size?: number | string
  color?: string
}>()

const icons = IconSet as unknown as Record<string, Component>

const resolved = computed<Component | undefined>(() => (props.name ? icons[props.name] : undefined))

watch(
  () => props.name,
  (name) => {
    if (name && !icons[name]) {
      console.warn(`[FsdIcon] 未找到图标：${name}`)
    }
  },
  { immediate: true },
)

const sizeValue = computed(() =>
  typeof props.size === 'number' ? `${props.size}px` : (props.size ?? '1em'),
)

const iconStyle = computed(() => ({ fontSize: sizeValue.value, color: props.color }))

const placeholderStyle = computed(() => ({
  ...iconStyle.value,
  display: 'inline-block',
  width: sizeValue.value,
  height: sizeValue.value,
}))
</script>

<template>
  <component :is="resolved" v-if="resolved" :style="iconStyle" />
  <span v-else :style="placeholderStyle" />
</template>
