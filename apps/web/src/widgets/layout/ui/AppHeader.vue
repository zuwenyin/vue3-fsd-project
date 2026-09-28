<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { FsdButton, FsdDropdown, FsdIcon, type FsdDropdownItem } from '@repo/ui'
import { useUserStore } from '@/entities/user'
import { useAuthStore } from '@/features/auth'
import { LayoutSwitch, useLayoutStore } from '@/features/layout-switch'
import { ColorPickerPanel, ThemeSwitch } from '@/features/theme-switch'
import { LAYOUT_SHELL_KEY } from '../model/layout-shell'
import AppBreadcrumb from './AppBreadcrumb.vue'
import AppLogo from './AppLogo.vue'

defineOptions({ name: 'AppHeader' })

withDefaults(
  defineProps<{
    /** 顶部栏模式把 Logo 放 Header；侧边栏模式放 Aside（docs/15 §2.4） */
    showLogo?: boolean
    showBreadcrumb?: boolean
  }>(),
  { showLogo: false, showBreadcrumb: true },
)

const router = useRouter()
const user = useUserStore()
const auth = useAuthStore()
const layout = useLayoutStore()

/** 抽屉/折叠的开关动作归 AppLayout，这里只发信号（避免两处持有状态） */
const shell = inject(LAYOUT_SHELL_KEY, { toggleSidebar: () => {}, isMobile: ref(false) })
const collapseIcon = computed(() => (layout.collapsed ? 'Expand' : 'Fold'))

const userItems: FsdDropdownItem[] = [
  { label: '个人中心', value: 'profile', icon: 'User' },
  { label: '退出登录', value: 'logout', icon: 'SwitchButton', divided: true },
]

async function onUserSelect(value: string): Promise<void> {
  if (value === 'logout') {
    await auth.logout()
    await router.replace({ name: 'Login' })
    return
  }
  // Profile 由后端菜单下发，未下发时不做任何事
  if (value === 'profile' && router.hasRoute('Profile')) await router.push({ name: 'Profile' })
}

const colorPanelVisible = ref(false)

function onLangPlaceholder(): void {
  ElMessage.info('多语言在 P7 接入')
}
</script>

<template>
  <header class="app-header">
    <FsdButton
      class="app-header__button"
      text
      :icon="collapseIcon"
      title="折叠 / 展开侧边栏"
      @click="shell.toggleSidebar()"
    />
    <AppLogo v-if="showLogo" class="app-header__logo" />
    <AppBreadcrumb v-if="showBreadcrumb" class="app-header__breadcrumb" />
    <div class="app-header__center">
      <slot name="center" />
    </div>
    <span class="app-header__spacer" />

    <LayoutSwitch class="app-header__item" />
    <ThemeSwitch class="app-header__item" @open-custom="colorPanelVisible = true" />
    <FsdButton class="app-header__button" text title="多语言（P7 接入）" @click="onLangPlaceholder">
      中/EN
    </FsdButton>
    <FsdDropdown class="app-header__item" :items="userItems" @select="onUserSelect">
      <FsdIcon name="User" :size="14" />
      <span class="app-header__user">{{ user.nickname }}</span>
      <FsdIcon name="ArrowDown" :size="12" />
    </FsdDropdown>

    <ColorPickerPanel v-model:visible="colorPanelVisible" />
  </header>
</template>

<style scoped lang="scss">
.app-header {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: var(--fsd-space-sm);
  height: 56px;
  padding: 0 var(--fsd-space-lg);
  background: var(--fsd-color-bg);
  border-bottom: 1px solid var(--fsd-color-border);
}

.app-header__logo {
  height: auto;
  padding: 0;
}

.app-header__center {
  display: flex;
  align-items: center;
  min-width: 0;
}

.app-header__spacer {
  flex: 1;
}

.app-header__item {
  flex-shrink: 0;
}

.app-header__user {
  color: var(--fsd-color-text-secondary);
}

@media (width < 960px) {
  .app-header__breadcrumb,
  .app-header__center,
  .app-header__item {
    display: none;
  }
}
</style>
