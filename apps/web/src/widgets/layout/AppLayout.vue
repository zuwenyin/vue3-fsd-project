<script setup lang="ts">
import { computed, provide, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useBreakpoints } from '@vueuse/core'
import { useMenuStore } from '@/entities/menu'
import { LAYOUT_MOBILE_BREAKPOINT, useLayoutStore } from '@/features/layout-switch'
import { LAYOUT_SHELL_KEY, type LayoutShell } from './model/layout-shell'
import { resolveLayout } from './model/layout-map'
import AppSidebarDrawer from './ui/AppSidebarDrawer.vue'

defineOptions({ name: 'AppLayout' })

const route = useRoute()
const layout = useLayoutStore()
const menu = useMenuStore()

/** < 960px 全部模式强制抽屉（docs/15 §2.5） */
const breakpoints = useBreakpoints({ sm: LAYOUT_MOBILE_BREAKPOINT })
const isMobile = computed(() => breakpoints.smaller('sm').value)

/** 单页覆盖：route.meta.layout ?? 全局模式（docs/15 §2.2） */
const current = computed(() => resolveLayout(route.meta.layout ?? layout.mode))

/** 抽屉状态唯一持有者；Header 只发信号（docs/15 §2.5） */
const drawerVisible = ref(false)

function toggleSidebar(): void {
  if (isMobile.value) drawerVisible.value = !drawerVisible.value
  else layout.toggleCollapsed()
}

provide(LAYOUT_SHELL_KEY, { toggleSidebar, isMobile } satisfies LayoutShell)
</script>

<template>
  <!-- 四布局共用同一份菜单树与内容区；切换布局不重建路由、不刷新页面（docs/15 §2.2） -->
  <component :is="current">
    <template #main>
      <router-view />
    </template>
  </component>

  <AppSidebarDrawer v-model="drawerVisible" :items="menu.tree" />
</template>
