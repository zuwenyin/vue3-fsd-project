<script setup lang="ts">
import { FsdIcon } from '@repo/ui'
import { resolveMenuTitle, type MenuItem } from '@/entities/menu'

defineOptions({ name: 'MenuItemContent' })

defineProps<{ item: MenuItem }>()
</script>

<template>
  <FsdIcon v-if="item.icon" class="menu-item-content__icon" :name="item.icon" :size="16" />
  <span class="menu-item-content__title">{{ resolveMenuTitle(item) }}</span>
  <FsdIcon v-if="item.external" class="menu-item-content__external" name="Link" :size="12" />
</template>

<style scoped lang="scss">
.menu-item-content__icon {
  margin-right: var(--fsd-space-xs);
}

.menu-item-content__external {
  margin-left: var(--fsd-space-xs);
  color: var(--fsd-color-text-weak);
}
</style>
