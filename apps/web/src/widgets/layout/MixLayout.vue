<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import { FsdMenu } from '@repo/ui'
import { useLayoutStore } from '@/features/layout-switch'
import { LAYOUT_SHELL_KEY } from './model/layout-shell'
import { useRootMenu } from './model/use-root-menu'
import AppHeader from './ui/AppHeader.vue'
import AppLogo from './ui/AppLogo.vue'
import MenuTree from './ui/MenuTree.vue'

defineOptions({ name: 'MixLayout' })

const layout = useLayoutStore()
const { activeKey, onSelect, activeRoot, rootsOnly, subItems, onRootSelect } = useRootMenu()
const shell = inject(LAYOUT_SHELL_KEY, {
  toggleSidebar: () => {},
  toggleSettings: () => {},
  isMobile: ref(false),
})

/** 次级栏在移动端隐藏（走抽屉，docs/15 §2.5） */
const showAside = computed(() => !shell.isMobile.value && subItems.value.length > 0)
const asideWidth = computed(() => (layout.collapsed ? '64px' : '200px'))
</script>

<template>
  <div class="mix-layout">
    <AppHeader />
    <div v-if="!shell.isMobile.value" class="mix-layout__top">
      <AppLogo class="mix-layout__logo" />
      <FsdMenu
        mode="horizontal"
        :default-active="activeRoot"
        :ellipsis="false"
        @select="onRootSelect"
      >
        <MenuTree :items="rootsOnly" mode="horizontal" />
      </FsdMenu>
    </div>

    <div class="mix-layout__body">
      <aside v-if="showAside" class="mix-layout__aside" :style="{ width: asideWidth }">
        <FsdMenu
          class="mix-layout__menu"
          :default-active="activeKey"
          :collapse="layout.collapsed"
          unique-opened
          @select="onSelect"
        >
          <MenuTree :items="subItems" />
        </FsdMenu>
      </aside>

      <main class="mix-layout__main">
        <slot name="main" />
      </main>
    </div>
  </div>
</template>

<style scoped lang="scss">
.mix-layout {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--fsd-color-bg-page);
}

.mix-layout__top {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: var(--fsd-space-sm);
  padding: 0 var(--fsd-space-lg);
  background: var(--fsd-color-bg);
  border-bottom: 1px solid var(--fsd-color-border);
}

.mix-layout__logo {
  height: 48px;
}

.mix-layout__body {
  display: flex;
  flex: 1;
  min-height: 0;
}

.mix-layout__aside {
  flex-shrink: 0;
  overflow: auto;
  background: var(--fsd-color-bg);
  border-right: 1px solid var(--fsd-color-border);
  transition: width 0.2s;
}

.mix-layout__menu {
  flex: 1;
  border-right: none;
}

.mix-layout__main {
  flex: 1;
  min-width: 0;
  overflow: auto;
}
</style>
