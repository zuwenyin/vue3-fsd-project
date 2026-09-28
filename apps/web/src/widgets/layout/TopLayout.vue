<script setup lang="ts">
import { inject, ref } from 'vue'
import { FsdMenu } from '@repo/ui'
import { LAYOUT_SHELL_KEY } from './model/layout-shell'
import { useMenuNavigation } from './model/use-menu-navigation'
import AppHeader from './ui/AppHeader.vue'
import MenuTree from './ui/MenuTree.vue'

defineOptions({ name: 'TopLayout' })

const { menu, activeKey, onSelect } = useMenuNavigation()
const shell = inject(LAYOUT_SHELL_KEY, { toggleSidebar: () => {}, isMobile: ref(false) })
</script>

<template>
  <div class="top-layout">
    <AppHeader show-logo :show-breadcrumb="false" />

    <div v-if="!shell.isMobile.value" class="top-layout__menu">
      <FsdMenu mode="horizontal" :default-active="activeKey" :ellipsis="false" @select="onSelect">
        <MenuTree :items="menu.tree" mode="horizontal" />
      </FsdMenu>
    </div>

    <main class="top-layout__main">
      <slot name="main" />
    </main>
  </div>
</template>

<style scoped lang="scss">
.top-layout {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--fsd-color-bg-page);
}

.top-layout__menu {
  flex-shrink: 0;
  padding: 0 var(--fsd-space-lg);
  background: var(--fsd-color-bg);
  border-bottom: 1px solid var(--fsd-color-border);
}

.top-layout__main {
  flex: 1;
  overflow: auto;
}
</style>
