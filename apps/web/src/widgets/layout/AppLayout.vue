<script setup lang="ts">
import { computed, provide, ref } from 'vue'
import { useRoute, type RouteLocationNormalizedLoaded } from 'vue-router'
import { useBreakpoints } from '@vueuse/core'
import { useMenuStore } from '@/entities/menu'
import {
  LAYOUT_MOBILE_BREAKPOINT,
  LayoutSettingsDrawer,
  useLayoutStore,
} from '@/features/layout-switch'
import { useTabsStore } from '@/features/tabs'
import { LAYOUT_SHELL_KEY, type LayoutShell } from './model/layout-shell'
import { resolveLayout } from './model/layout-map'
import AppSidebarDrawer from './ui/AppSidebarDrawer.vue'
import AppTabs from './ui/AppTabs.vue'
import AppWatermark from './ui/AppWatermark.vue'

defineOptions({ name: 'AppLayout' })

const route = useRoute()
const layout = useLayoutStore()
const menu = useMenuStore()
const tabs = useTabsStore()

/**
 * keep-alive 页用 route.name 作 key（同组件不同参数复用实例）；其余页用 fullPath 保证重建。
 * 刷新过的页签附上 refreshStamp → 仅该页 key 变化，实现「重建但不动其他缓存」（docs/15 §3.3）。
 */
function keepAliveKey(currentRoute: RouteLocationNormalizedLoaded): string {
  const base = currentRoute.meta.keepAlive ? String(currentRoute.name) : currentRoute.fullPath
  const stamp = tabs.stampOf(String(currentRoute.name ?? ''))
  return stamp ? `${base}@${stamp}` : base
}

/** < 960px 全部模式强制抽屉（docs/15 §2.5） */
const breakpoints = useBreakpoints({ sm: LAYOUT_MOBILE_BREAKPOINT })
const isMobile = computed(() => breakpoints.smaller('sm').value)

/** 单页覆盖：route.meta.layout ?? 全局模式（docs/15 §2.2） */
const current = computed(() => resolveLayout(route.meta.layout ?? layout.mode))

/** 页面切换动画名（docs/04 §7.4，P9）；关闭时不传 name → 无匹配过渡类，即无动画 */
const transitionName = computed(() => (layout.pageTransition ? 'fsd-fade-slide' : undefined))

/** 抽屉状态唯一持有者；Header 只发信号（docs/15 §2.5） */
const drawerVisible = ref(false)
/** 布局设置抽屉状态：同样归 AppLayout（切布局会重建 Header，状态放 Header 会丢失，P9 踩坑） */
const settingsVisible = ref(false)

function toggleSidebar(): void {
  if (isMobile.value) drawerVisible.value = !drawerVisible.value
  else layout.toggleCollapsed()
}

function toggleSettings(): void {
  settingsVisible.value = !settingsVisible.value
}

provide(LAYOUT_SHELL_KEY, { toggleSidebar, toggleSettings, isMobile } satisfies LayoutShell)
</script>

<template>
  <!-- 四布局共用同一份菜单树与内容区；切换布局不重建路由、不刷新页面（docs/15 §2.2） -->
  <component :is="current">
    <template #main>
      <div class="app-layout-content">
        <AppTabs />
        <div class="app-layout-content__view">
          <AppWatermark v-if="layout.watermark" />
          <router-view v-slot="{ Component, route: currentRoute }">
            <!-- Transition 必须在 keep-alive 外层；mode="out-in" 避免新旧页同时在场（docs/04 §7.4） -->
            <Transition :name="transitionName" mode="out-in">
              <keep-alive :include="tabs.cachedViews">
                <component :is="Component" :key="keepAliveKey(currentRoute)" />
              </keep-alive>
            </Transition>
          </router-view>
        </div>
      </div>
    </template>
  </component>

  <AppSidebarDrawer v-model="drawerVisible" :items="menu.tree" />
  <LayoutSettingsDrawer v-model="settingsVisible" />
</template>

<style scoped lang="scss">
.app-layout-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.app-layout-content__view {
  position: relative;
  flex: 1;
  overflow: auto;
}
</style>
