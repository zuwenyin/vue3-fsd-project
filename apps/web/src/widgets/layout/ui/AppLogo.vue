<script setup lang="ts">
import { FsdIcon } from '@repo/ui'

defineOptions({ name: 'AppLogo' })

withDefaults(defineProps<{ collapsed?: boolean }>(), { collapsed: false })
</script>

<template>
  <div class="app-logo">
    <FsdIcon class="app-logo__mark" name="Grid" :size="18" />
    <span v-if="!collapsed" class="app-logo__text">FSD Template</span>
  </div>
</template>

<style scoped lang="scss">
.app-logo {
  display: flex;
  align-items: center;
  gap: var(--fsd-space-xs);
  height: 56px;
  padding: 0 var(--fsd-space-md);
  overflow: hidden;
  white-space: nowrap;
}

.app-logo__mark {
  color: var(--fsd-color-primary);
}

.app-logo__text {
  font-size: var(--fsd-font-size-lg);
  font-weight: 600;
  color: var(--fsd-color-text);
}
</style>
