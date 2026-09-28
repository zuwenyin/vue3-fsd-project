<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { resolveMenuTitle } from '@/entities/menu'

defineOptions({ name: 'AppBreadcrumb' })

const route = useRoute()

/**
 * 面包屑取 `route.matched` 的 meta（后端下发的 title / titleKey），
 * 过滤掉没有标题的层级（Layout 根路由无 meta）。
 * 纯目录节点没有可跳转路由，因此只做展示、不做链接。
 */
const crumbs = computed(() =>
  route.matched
    .filter((record) => Boolean(record.meta.title || record.meta.titleKey))
    .map((record) => ({
      key: typeof record.name === 'string' ? record.name : record.path,
      title: resolveMenuTitle(record.meta),
    })),
)
</script>

<template>
  <nav v-if="crumbs.length > 0" class="app-breadcrumb" aria-label="面包屑">
    <template v-for="(crumb, index) in crumbs" :key="crumb.key">
      <span v-if="index > 0" class="app-breadcrumb__separator">/</span>
      <span
        class="app-breadcrumb__item"
        :class="{ 'app-breadcrumb__item--current': index === crumbs.length - 1 }"
      >
        {{ crumb.title }}
      </span>
    </template>
  </nav>
</template>

<style scoped lang="scss">
.app-breadcrumb {
  display: flex;
  align-items: center;
  gap: var(--fsd-space-xs);
  overflow: hidden;
  white-space: nowrap;
}

.app-breadcrumb__separator {
  color: var(--fsd-color-text-weak);
}

.app-breadcrumb__item {
  color: var(--fsd-color-text-secondary);
}

.app-breadcrumb__item--current {
  color: var(--fsd-color-text);
}
</style>
