<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import { FsdMenu } from '@repo/ui'
import { LAYOUT_SHELL_KEY } from './model/layout-shell'
import { useRootMenu } from './model/use-root-menu'
import AppHeader from './ui/AppHeader.vue'
import AppLogo from './ui/AppLogo.vue'
import MenuTree from './ui/MenuTree.vue'

defineOptions({ name: 'DualLayout' })

const { activeKey, onSelect, activeRoot, rootsOnly, subItems, onRootSelect } = useRootMenu()
const shell = inject(LAYOUT_SHELL_KEY, { toggleSidebar: () => {}, isMobile: ref(false) })

/** 窄条（一级）+ 次级侧栏；移动端整体走抽屉（docs/15 §2.4） */
const showAsides = computed(() => !shell.isMobile.value)
</script>

<template>
  <div class="dual-layout">
    <template v-if="showAsides">
      <aside class="dual-layout__rail">
        <AppLogo :collapsed="true" class="dual-layout__logo" />
        <FsdMenu
          class="dual-layout__rail-menu"
          :default-active="activeRoot"
          :collapse="true"
          @select="onRootSelect"
        >
          <MenuTree :items="rootsOnly" />
        </FsdMenu>
      </aside>

      <aside class="dual-layout__sub">
        <FsdMenu
          class="dual-layout__sub-menu"
          :default-active="activeKey"
          unique-opened
          @select="onSelect"
        >
          <MenuTree :items="subItems" />
        </FsdMenu>
      </aside>
    </template>

    <div class="dual-layout__right">
      <AppHeader />
      <main class="dual-layout__main">
        <slot name="main" />
      </main>
    </div>
  </div>
</template>

<style scoped lang="scss">
.dual-layout {
  display: flex;
  height: 100%;
  background: var(--fsd-color-bg-page);
}

.dual-layout__rail {
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  width: 72px;
  overflow: hidden auto;
  background: var(--fsd-color-bg);
  border-right: 1px solid var(--fsd-color-border);
}

.dual-layout__logo {
  height: 56px;
}

.dual-layout__rail-menu {
  flex: 1;
  border-right: none;
}

.dual-layout__sub {
  flex-shrink: 0;
  width: 180px;
  overflow: auto;
  background: var(--fsd-color-bg);
  border-right: 1px solid var(--fsd-color-border);
}

.dual-layout__sub-menu {
  border-right: none;
}

.dual-layout__right {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
}

.dual-layout__main {
  flex: 1;
  overflow: auto;
}
</style>
