<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { FsdButton, FsdMenu } from '@repo/ui'
import { useMenuStore } from '@/entities/menu'
import { useUserStore } from '@/entities/user'
import { useAuthStore } from '@/features/auth'
import MenuTree from './ui/MenuTree.vue'

defineOptions({ name: 'AppLayout' })

const route = useRoute()
const router = useRouter()
const menu = useMenuStore()
const user = useUserStore()
const auth = useAuthStore()

// 详情页可用 meta.activePath 回指父菜单（docs/03 §5）
const activePath = computed(() => route.meta.activePath ?? route.path)

async function onSelect(index: string): Promise<void> {
  if (route.path !== index) await router.push(index)
}

async function onLogout(): Promise<void> {
  await auth.logout()
  await router.replace({ name: 'Login' })
}
</script>

<template>
  <div class="app-layout">
    <!-- P4 替换为 Header / Sidebar 四布局（docs/15）；P3 先提供最小可用的菜单与登出入口 -->
    <header class="app-layout__header">
      <span class="app-layout__brand">FSD Template</span>
      <span class="app-layout__spacer" />
      <span class="app-layout__user">{{ user.nickname }}</span>
      <FsdButton link type="primary" @click="onLogout">退出登录</FsdButton>
    </header>

    <div class="app-layout__body">
      <aside class="app-layout__aside">
        <FsdMenu :default-active="activePath" @select="onSelect">
          <MenuTree :items="menu.tree" />
        </FsdMenu>
      </aside>

      <main class="app-layout__main">
        <router-view />
      </main>
    </div>
  </div>
</template>

<style scoped lang="scss">
.app-layout {
  display: flex;
  flex-direction: column;
  height: 100%;
  color: var(--fsd-color-text);
  background: var(--fsd-color-bg-page);
}

.app-layout__header {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  height: 56px;
  padding: 0 var(--fsd-space-lg);
  border-bottom: 1px solid var(--fsd-color-border);
  background: var(--fsd-color-bg);
}

.app-layout__brand {
  font-size: var(--fsd-font-size-lg);
  font-weight: 600;
}

.app-layout__spacer {
  flex: 1;
}

.app-layout__user {
  margin-right: var(--fsd-space-sm);
  color: var(--fsd-color-text-secondary);
}

.app-layout__body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.app-layout__aside {
  flex-shrink: 0;
  width: 220px;
  overflow: auto;
  border-right: 1px solid var(--fsd-color-border);
  background: var(--fsd-color-bg);
}

.app-layout__main {
  flex: 1;
  overflow: auto;
}
</style>
