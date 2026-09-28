<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { FsdIcon } from '@repo/ui'
import {
  HOME_ROUTE_NAME,
  TabContextMenu,
  useTabsStore,
  type TabContextAction,
  type TabView,
} from '@/features/tabs'

defineOptions({ name: 'AppTabs' })

const route = useRoute()
const router = useRouter()
const tabs = useTabsStore()

const currentName = computed(() => (typeof route.name === 'string' ? route.name : ''))

onMounted(() => {
  // 恢复必须晚于动态路由注册：本组件由 AppLayout 渲染，此时守卫已完成 applyRoutes（docs/15 §3.3）
  tabs.restore(router)
  tabs.addView(route)
})

watch(
  () => route.fullPath,
  () => tabs.addView(route),
)

// ---------- 关闭与跳转 ----------

/** 关闭后若当前页签已不在列表，跳到相邻 affix / 首页 */
async function ensureCurrentVisible(): Promise<void> {
  if (tabs.visitedViews.some((view) => view.name === currentName.value)) return
  const fallback = tabs.visitedViews.find((view) => view.affix)
  if (fallback) {
    await router.push({ name: fallback.name })
    return
  }
  if (router.hasRoute(HOME_ROUTE_NAME)) await router.push({ name: HOME_ROUTE_NAME })
  else await router.push('/')
}

async function closeView(view: TabView): Promise<void> {
  if (view.affix) return
  tabs.closeView(view.name)
  await ensureCurrentVisible()
}

// ---------- 右键菜单 ----------

const menuVisible = ref(false)
const menuX = ref(0)
const menuY = ref(0)
const menuTarget = ref<TabView | null>(null)

const targetIndex = computed(() =>
  menuTarget.value
    ? tabs.visitedViews.findIndex((view) => view.name === menuTarget.value?.name)
    : -1,
)

const menuActions = computed<TabContextAction[]>(() => {
  const target = menuTarget.value
  if (!target) return []
  return [
    { key: 'refresh', label: '刷新' },
    { key: 'close', label: '关闭', disabled: target.affix },
    { key: 'closeOthers', label: '关闭其他', disabled: tabs.visitedViews.length <= 1 },
    { key: 'closeLeft', label: '关闭左侧', disabled: targetIndex.value <= 0 },
    {
      key: 'closeRight',
      label: '关闭右侧',
      disabled: targetIndex.value >= tabs.visitedViews.length - 1,
    },
    { key: 'closeAll', label: '全部关闭', disabled: tabs.visitedViews.length === 0 },
  ]
})

function openMenu(event: MouseEvent, view: TabView): void {
  // 阻止冒泡：ContextMenu 监听 document 的 contextmenu 来关闭自己
  event.stopPropagation()
  menuTarget.value = view
  menuX.value = event.clientX
  menuY.value = event.clientY
  menuVisible.value = true
}

async function onMenuSelect(key: TabContextAction['key']): Promise<void> {
  const target = menuTarget.value
  if (!target) return
  const name = target.name

  switch (key) {
    case 'refresh':
      // 踢缓存 + 更新刷新戳（AppLayout 的 :key 会变化）→ 组件重建并重新取数
      await tabs.refreshView(name)
      return
    case 'close':
      tabs.closeView(name)
      break
    case 'closeOthers':
      tabs.closeOthers(name)
      break
    case 'closeLeft':
      tabs.closeLeft(name)
      break
    case 'closeRight':
      tabs.closeRight(name)
      break
    case 'closeAll':
      tabs.closeAll()
      break
  }
  await ensureCurrentVisible()
}
</script>

<template>
  <nav v-if="tabs.visitedViews.length > 0" class="app-tabs" aria-label="页签">
    <router-link
      v-for="view in tabs.visitedViews"
      :key="view.name"
      class="app-tabs__item"
      :class="{ 'app-tabs__item--active': view.name === currentName }"
      :to="{ name: view.name }"
      @contextmenu.prevent="openMenu($event, view)"
    >
      <FsdIcon v-if="view.icon" class="app-tabs__icon" :name="view.icon" :size="12" />
      <span class="app-tabs__title">{{ view.title }}</span>
      <button
        v-if="!view.affix"
        type="button"
        class="app-tabs__close"
        :aria-label="`关闭 ${view.title}`"
        @click.prevent.stop="closeView(view)"
      >
        ×
      </button>
    </router-link>

    <TabContextMenu
      :visible="menuVisible"
      :x="menuX"
      :y="menuY"
      :actions="menuActions"
      @select="onMenuSelect"
      @close="menuVisible = false"
    />
  </nav>
</template>

<style scoped lang="scss">
.app-tabs {
  display: flex;
  flex-shrink: 0;
  gap: var(--fsd-space-xs);
  align-items: center;
  padding: var(--fsd-space-xs) var(--fsd-space-md);
  overflow-x: auto;
  background: var(--fsd-color-bg);
  border-bottom: 1px solid var(--fsd-color-border);
}

.app-tabs__item {
  display: inline-flex;
  flex-shrink: 0;
  gap: var(--fsd-space-xs);
  align-items: center;
  padding: var(--fsd-space-xs) var(--fsd-space-sm);
  font-size: var(--fsd-font-size-base);
  color: var(--fsd-color-text-secondary);
  text-decoration: none;
  background: var(--fsd-color-bg-sub);
  border: 1px solid var(--fsd-color-border);
  border-radius: var(--fsd-radius-sm);
}

.app-tabs__item--active {
  color: var(--fsd-color-primary);
  border-color: var(--fsd-color-primary);
}

.app-tabs__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 var(--fsd-space-xs);
  font-size: var(--fsd-font-size-base);
  color: inherit;
  cursor: pointer;
  background: none;
  border: none;
}

.app-tabs__close:hover {
  color: var(--fsd-color-danger);
}
</style>
