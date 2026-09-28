<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import { FsdMenu } from '@repo/ui'
import { useLayoutStore } from '@/features/layout-switch'
import { LAYOUT_SHELL_KEY } from './model/layout-shell'
import { useMenuNavigation } from './model/use-menu-navigation'
import AppHeader from './ui/AppHeader.vue'
import AppLogo from './ui/AppLogo.vue'
import MenuTree from './ui/MenuTree.vue'

defineOptions({ name: 'SidebarLayout' })

const layout = useLayoutStore()
const { menu, activeKey, onSelect } = useMenuNavigation()
const shell = inject(LAYOUT_SHELL_KEY, { toggleSidebar: () => {}, isMobile: ref(false) })

const asideWidth = computed(() => (layout.collapsed ? '64px' : '210px'))
</script>

<template>
  <div class="sidebar-layout">
    <aside
      v-if="!shell.isMobile.value"
      class="sidebar-layout__aside"
      :style="{ width: asideWidth }"
    >
      <AppLogo :collapsed="layout.collapsed" />
      <FsdMenu
        class="sidebar-layout__menu"
        :default-active="activeKey"
        :collapse="layout.collapsed"
        unique-opened
        @select="onSelect"
      >
        <MenuTree :items="menu.tree" />
      </FsdMenu>
    </aside>

    <div class="sidebar-layout__right">
      <AppHeader />
      <main class="sidebar-layout__main">
        <slot name="main" />
      </main>
    </div>
  </div>
</template>

<style scoped lang="scss">
.sidebar-layout {
  display: flex;
  height: 100%;
  background: var(--fsd-color-bg-page);
}

.sidebar-layout__aside {
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  overflow: auto;
  background: var(--fsd-color-bg);
  border-right: 1px solid var(--fsd-color-border);
  transition: width 0.2s;
}

.sidebar-layout__menu {
  flex: 1;
  border-right: none;
}

.sidebar-layout__right {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
}

.sidebar-layout__main {
  flex: 1;
  overflow: auto;
}
</style>
