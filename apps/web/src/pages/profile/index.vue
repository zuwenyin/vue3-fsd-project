<script setup lang="ts">
// ★ 组件名必须等于后端菜单 name（route.name），否则 keep-alive :include 静默失效（docs/15 §3.2）
defineOptions({ name: 'Profile' })
</script>

<template>
  <div class="profile">个人中心（种子菜单 Profile 指向此页）</div>
</template>

<style scoped lang="scss">
.profile {
  padding: var(--fsd-space-lg);
  color: var(--fsd-color-text);
}
</style>
