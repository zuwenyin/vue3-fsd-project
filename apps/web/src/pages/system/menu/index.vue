<script setup lang="ts">
import { FsdButton } from '@repo/ui'

defineOptions({ name: 'SystemMenuPage' })
</script>

<template>
  <div class="system-menu">
    <div class="system-menu__header">
      <h2 class="system-menu__title">菜单管理</h2>
      <!-- 按钮级权限（docs/03 §6）：editor 仅 system:menu:view，看不到「新增菜单」 -->
      <FsdButton v-permission="'system:menu:edit'" type="primary" disabled>新增菜单</FsdButton>
    </div>
    <p class="system-menu__tip">
      P3.5 在此实现菜单配置工作台（docs/14），本期仅占位以打通动态路由。
    </p>
  </div>
</template>

<style scoped lang="scss">
.system-menu {
  padding: var(--fsd-space-lg);
}

.system-menu__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--fsd-space-sm);
}

.system-menu__title {
  margin: 0;
  font-size: var(--fsd-font-size-lg);
}

.system-menu__tip {
  color: var(--fsd-color-text-secondary);
}
</style>
