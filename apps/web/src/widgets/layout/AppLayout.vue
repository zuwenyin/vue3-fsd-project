<script setup lang="ts">
defineOptions({ name: 'AppLayout' })
</script>

<template>
  <div class="app-layout">
    <!-- P4 替换为真实 Header / Sidebar（docs/15） -->
    <header class="app-layout__header">FSD Template</header>
    <main class="app-layout__main">
      <router-view />
    </main>
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
  align-items: center;
  height: 56px;
  padding: 0 var(--fsd-space-lg);
  border-bottom: 1px solid var(--fsd-color-border);
  background: var(--fsd-color-bg);
}

.app-layout__main {
  flex: 1;
  overflow: auto;
}
</style>
