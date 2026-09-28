<script setup lang="ts">
import { computed } from 'vue'
import { FsdButton, FsdColorPicker, FsdDialog } from '@repo/ui'
import { PRIMARY_PRESETS } from '../model/constants'
import { useThemeStore } from '../model/theme.store'

defineOptions({ name: 'ColorPickerPanel' })

const props = defineProps<{ visible: boolean }>()
const emit = defineEmits<{ 'update:visible': [value: boolean] }>()

const theme = useThemeStore()

const predefine = computed(() => PRIMARY_PRESETS.map((item) => item.value))
</script>

<template>
  <FsdDialog
    :model-value="props.visible"
    title="主题设置"
    width="440px"
    :show-footer="false"
    @update:model-value="emit('update:visible', $event)"
  >
    <div class="color-panel">
      <p class="color-panel__label">预设色板</p>
      <div class="color-panel__swatches">
        <button
          v-for="preset in PRIMARY_PRESETS"
          :key="preset.value"
          type="button"
          class="color-panel__swatch"
          :class="{ 'color-panel__swatch--active': theme.primary === preset.value }"
          :style="{ backgroundColor: preset.value }"
          :title="preset.label"
          @click="theme.setPrimary(preset.value)"
        />
      </div>

      <p class="color-panel__label">自定义</p>
      <div class="color-panel__custom">
        <FsdColorPicker
          :model-value="theme.primary"
          :predefine="predefine"
          @update:model-value="theme.setPrimary"
        />
        <span class="color-panel__value">{{ theme.primary }}</span>
        <FsdButton @click="theme.resetTheme()">恢复默认</FsdButton>
      </div>
    </div>
  </FsdDialog>
</template>

<style scoped lang="scss">
.color-panel {
  display: flex;
  flex-direction: column;
  gap: var(--fsd-space-sm);
}

.color-panel__label {
  margin: 0;
  font-size: var(--fsd-font-size-base);
  color: var(--fsd-color-text-secondary);
}

.color-panel__swatches {
  display: flex;
  flex-wrap: wrap;
  gap: var(--fsd-space-sm);
}

.color-panel__swatch {
  width: 28px;
  height: 28px;
  cursor: pointer;
  border: 2px solid var(--fsd-color-border);
  border-radius: var(--fsd-radius-sm);
}

.color-panel__swatch--active {
  border-color: var(--fsd-color-text);
}

.color-panel__custom {
  display: flex;
  align-items: center;
  gap: var(--fsd-space-sm);
}

.color-panel__value {
  flex: 1;
  font-size: var(--fsd-font-size-base);
  color: var(--fsd-color-text-secondary);
}
</style>
