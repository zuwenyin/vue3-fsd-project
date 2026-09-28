<script setup lang="ts">
// ★ 组件名必须等于后端菜单 name（route.name），否则 keep-alive :include 静默失效（docs/15 §3.2）
defineOptions({ name: 'Dashboard' })
</script>

<template>
  <div class="dashboard">仪表盘占位页（待接入真实看板需求）</div>
</template>

<style scoped lang="scss">
.dashboard {
  padding: var(--fsd-space-lg);
  color: var(--fsd-color-text);
}
</style>
