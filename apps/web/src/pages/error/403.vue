<script setup lang="ts">
import { useRouter } from 'vue-router'
import { FsdButton } from '@repo/ui'

defineOptions({ name: 'ForbiddenPage' })

const router = useRouter()
</script>

<template>
  <div class="error-page">
    <h1 class="error-page__code">403</h1>
    <p class="error-page__desc">无权限访问</p>
    <FsdButton type="primary" @click="router.replace('/')">返回首页</FsdButton>
  </div>
</template>

<style scoped lang="scss">
.error-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--fsd-color-text);
}

.error-page__code {
  margin: 0;
  font-size: var(--fsd-font-size-xl);
}

.error-page__desc {
  margin: 0 0 var(--fsd-space-md);
}
</style>
