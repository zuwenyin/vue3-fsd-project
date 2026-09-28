<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { FsdButton, FsdSwitch } from '@repo/ui'
import { LAYOUT_MODES } from '../model/constants'
import { useLayoutStore } from '../model/layout.store'

defineOptions({ name: 'LayoutSettingsDrawer' })

defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const layout = useLayoutStore()
const { t } = useI18n()

function close(): void {
  emit('update:modelValue', false)
}
</script>

<template>
  <div v-if="modelValue" class="layout-settings">
    <div
      class="layout-settings__mask"
      role="button"
      tabindex="0"
      :aria-label="t('common.close')"
      @click="close"
      @keydown.enter="close"
    />
    <aside class="layout-settings__panel">
      <header class="layout-settings__head">
        <span class="layout-settings__title">{{ t('layout.settings') }}</span>
        <FsdButton text icon="Close" :title="t('common.close')" @click="close" />
      </header>

      <section class="layout-settings__section">
        <span class="layout-settings__label">{{ t('layout.mode') }}</span>
        <div class="layout-settings__modes">
          <FsdButton
            v-for="mode in LAYOUT_MODES"
            :key="mode"
            size="small"
            :type="layout.mode === mode ? 'primary' : 'default'"
            @click="layout.setMode(mode)"
          >
            {{ t(`layout.${mode}`) }}
          </FsdButton>
        </div>
      </section>

      <section class="layout-settings__row">
        <span class="layout-settings__label">{{ t('layout.breadcrumb') }}</span>
        <FsdSwitch :model-value="layout.breadcrumb" @update:model-value="layout.setBreadcrumb" />
      </section>

      <section class="layout-settings__row">
        <span class="layout-settings__label">{{ t('layout.pageTransition') }}</span>
        <FsdSwitch
          :model-value="layout.pageTransition"
          @update:model-value="layout.setPageTransition"
        />
      </section>

      <section class="layout-settings__row">
        <span class="layout-settings__label">
          {{ t('layout.watermark') }}
          <span class="layout-settings__tip">{{ t('layout.watermarkTip') }}</span>
        </span>
        <FsdSwitch :model-value="layout.watermark" @update:model-value="layout.setWatermark" />
      </section>
    </aside>
  </div>
</template>

<style scoped lang="scss">
.layout-settings {
  position: fixed;
  inset: 0;
  z-index: var(--fsd-z-index-drawer);
}

.layout-settings__mask {
  position: absolute;
  inset: 0;
  background: var(--fsd-color-text);
  opacity: 0.35;
}

.layout-settings__panel {
  position: absolute;
  inset-block: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  gap: var(--fsd-space-lg);
  width: 320px;
  padding: var(--fsd-space-lg);
  overflow: auto;
  background: var(--fsd-color-bg);
  box-shadow: var(--fsd-shadow-md);
}

.layout-settings__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.layout-settings__title {
  font-size: var(--fsd-font-size-lg);
  font-weight: 600;
}

.layout-settings__section {
  display: flex;
  flex-direction: column;
  gap: var(--fsd-space-sm);
}

.layout-settings__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--fsd-space-sm);
}

.layout-settings__label {
  display: flex;
  flex-direction: column;
  gap: var(--fsd-space-xs);
  color: var(--fsd-color-text-secondary);
}

.layout-settings__tip {
  font-size: var(--fsd-font-size-base);
  color: var(--fsd-color-text-weak);
}

.layout-settings__modes {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--fsd-space-sm);
}
</style>
