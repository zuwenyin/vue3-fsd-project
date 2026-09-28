<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { FsdIcon } from '@repo/ui'
import { resolveMenuTitle, type MenuItem } from '@/entities/menu'

defineOptions({ name: 'MenuItemContent' })

const props = defineProps<{ item: MenuItem }>()

// 决策 D2：titleKey 优先、缺失回落 title；传入 t 后切语言即时生效
const { t } = useI18n()
const title = computed(() => resolveMenuTitle(props.item, t))
</script>

<template>
  <FsdIcon v-if="item.icon" class="menu-item-content__icon" :name="item.icon" :size="16" />
  <span class="menu-item-content__title">{{ title }}</span>
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
