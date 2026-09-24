<script setup lang="ts">
import { computed, watch, type Component } from 'vue'
import * as IconSet from '@element-plus/icons-vue'
// 图标尺寸靠 `el-icon` 规则（base.css：.el-icon{width:1em;height:1em} + .el-icon svg{width:1em}）
// 不引样式时 SVG 会按默认尺寸撑满容器（实测踩坑）
import 'element-plus/es/components/icon/style/css'

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
  <component :is="resolved" v-if="resolved" class="el-icon" :style="iconStyle" />
  <span v-else class="el-icon" :style="placeholderStyle" />
</template>
