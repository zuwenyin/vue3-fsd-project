<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { FsdButton, FsdColorPicker, FsdDialog } from '@repo/ui'
import {
  COLOR_MODE_OPTIONS,
  DENSITY_OPTIONS,
  PRIMARY_PRESETS,
  RADIUS_OPTIONS,
} from '../model/constants'
import { useThemeStore } from '../model/theme.store'

defineOptions({ name: 'ColorPickerPanel' })

const props = defineProps<{ visible: boolean }>()
const emit = defineEmits<{ 'update:visible': [value: boolean] }>()

const theme = useThemeStore()
const { t } = useI18n()

const predefine = computed(() => PRIMARY_PRESETS.map((item) => item.value))

/** 档位值 → i18n key（radius-none → theme.radiusNone） */
function cap(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

/** P11 三组档位选项（label 走 i18n，value 为档位） */
const radiusChoices = computed(() =>
  RADIUS_OPTIONS.map((value) => ({ value, label: t(`theme.radius${cap(value)}`) })),
)
const densityChoices = computed(() =>
  DENSITY_OPTIONS.map((value) => ({ value, label: t(`theme.density${cap(value)}`) })),
)
const colorModeChoices = computed(() =>
  COLOR_MODE_OPTIONS.map((value) => ({ value, label: t(`theme.colorMode${cap(value)}`) })),
)
</script>

<template>
  <FsdDialog
    :model-value="props.visible"
    :title="t('theme.appearance')"
    width="440px"
    :show-footer="false"
    @update:model-value="emit('update:visible', $event)"
  >
    <div class="color-panel">
      <p class="color-panel__label">{{ t('theme.presets') }}</p>
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

      <p class="color-panel__label">{{ t('theme.custom') }}</p>
      <div class="color-panel__custom">
        <FsdColorPicker
          :model-value="theme.primary"
          :predefine="predefine"
          @update:model-value="theme.setPrimary"
        />
        <span class="color-panel__value">{{ theme.primary }}</span>
        <FsdButton @click="theme.resetTheme()">{{ t('theme.resetDefault') }}</FsdButton>
      </div>

      <p class="color-panel__label">{{ t('theme.radius') }}</p>
      <div class="color-panel__choices">
        <FsdButton
          v-for="item in radiusChoices"
          :key="item.value"
          size="small"
          :type="theme.radius === item.value ? 'primary' : 'default'"
          @click="theme.setRadius(item.value)"
        >
          {{ item.label }}
        </FsdButton>
      </div>

      <p class="color-panel__label">{{ t('theme.density') }}</p>
      <div class="color-panel__choices">
        <FsdButton
          v-for="item in densityChoices"
          :key="item.value"
          size="small"
          :type="theme.density === item.value ? 'primary' : 'default'"
          @click="theme.setDensity(item.value)"
        >
          {{ item.label }}
        </FsdButton>
      </div>

      <p class="color-panel__label">{{ t('theme.colorMode') }}</p>
      <div class="color-panel__choices">
        <FsdButton
          v-for="item in colorModeChoices"
          :key="item.value"
          size="small"
          :type="theme.colorMode === item.value ? 'primary' : 'default'"
          @click="theme.setColorMode(item.value)"
        >
          {{ item.label }}
        </FsdButton>
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

.color-panel__choices {
  display: flex;
  flex-wrap: wrap;
  gap: var(--fsd-space-sm);
}
</style>
