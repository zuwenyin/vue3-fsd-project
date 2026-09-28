<script setup lang="ts">
import { MenuWorkbench } from '@/features/menu-management'

// ★ 组件名必须等于后端菜单 name（route.name），否则 keep-alive :include 静默失效（docs/15 §3.2）
defineOptions({ name: 'SystemMenu' })
</script>

<template>
  <MenuWorkbench />
</template>
