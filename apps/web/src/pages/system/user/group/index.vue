<script setup lang="ts">
defineOptions({ name: 'SystemUserGroupPage' })
</script>

<template>
  <div class="system-user-group">
    <h2 class="system-user-group__title">用户分组</h2>
    <p class="system-user-group__tip">
      3 级菜单占位页：用于验证四布局的多级菜单、面包屑，以及「3 级节点不能再加子级」。
    </p>
  </div>
</template>

<style scoped lang="scss">
.system-user-group {
  padding: var(--fsd-space-lg);
}

.system-user-group__title {
  margin: 0 0 var(--fsd-space-sm);
  font-size: var(--fsd-font-size-lg);
}

.system-user-group__tip {
  color: var(--fsd-color-text-secondary);
}
</style>
