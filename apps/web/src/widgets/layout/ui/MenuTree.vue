<script setup lang="ts">
import { FsdMenuItem, FsdSubMenu } from '@repo/ui'
import type { MenuItem } from '@/entities/menu'
import MenuItemContent from './MenuItemContent.vue'

defineOptions({ name: 'MenuTree' })

withDefaults(
  defineProps<{
    items: MenuItem[]
    /** 容器模式（vertical / horizontal 由 FsdMenu 决定，这里只做样式钩子） */
    mode?: 'vertical' | 'horizontal' | 'popper'
    depth?: number
  }>(),
  { mode: 'vertical', depth: 1 },
)
</script>

<template>
  <template v-for="item in items" :key="item.key">
    <!-- 外链：不注册路由，渲染为 <a target="_blank">（docs/15 §2.3） -->
    <FsdMenuItem v-if="item.external" :index="item.key">
      <a class="menu-tree__external" :href="item.path" target="_blank" rel="noopener noreferrer">
        <MenuItemContent :item="item" />
      </a>
    </FsdMenuItem>

    <FsdSubMenu v-else-if="item.children?.length" :index="item.key">
      <template #title>
        <MenuItemContent :item="item" />
      </template>
      <MenuTree :items="item.children" :mode="mode" :depth="depth + 1" />
    </FsdSubMenu>

    <FsdMenuItem v-else :index="item.key">
      <MenuItemContent :item="item" />
    </FsdMenuItem>
  </template>
</template>

<style scoped lang="scss">
.menu-tree__external {
  display: inline-flex;
  align-items: center;
  color: inherit;
  text-decoration: none;
}
</style>
