<script setup lang="ts">
defineOptions({ name: 'SystemUserPage' })
</script>

<template>
  <div class="system-user">
    <h2 class="system-user__title">用户管理</h2>
    <p class="system-user__tip">P3 占位页：仅用于验证动态路由与权限过滤，业务功能不在本期范围。</p>
  </div>
</template>

<style scoped lang="scss">
.system-user {
  padding: var(--fsd-space-lg);
}

.system-user__title {
  margin: 0 0 var(--fsd-space-sm);
  font-size: var(--fsd-font-size-lg);
}

.system-user__tip {
  color: var(--fsd-color-text-secondary);
}
</style>
