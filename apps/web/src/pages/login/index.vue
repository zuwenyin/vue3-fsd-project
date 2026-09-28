<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { FsdButton, FsdForm, FsdFormItem, FsdInput } from '@repo/ui'
import { useAuthStore } from '@/features/auth'

defineOptions({ name: 'LoginPage' })

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const { t } = useI18n()
const form = ref({ username: 'admin', password: 'admin123' })

async function onSubmit(): Promise<void> {
  try {
    await auth.login(form.value.username, form.value.password)
    ElMessage.success(t('login.success'))
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    await router.replace(redirect)
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t('login.failed'))
  }
}
</script>

<template>
  <div class="login">
    <FsdForm class="login__form" :model="form">
      <h1 class="login__title">{{ t('login.submit') }}</h1>
      <FsdFormItem :label="t('login.username')">
        <FsdInput v-model="form.username" :placeholder="t('login.usernameRequired')" />
      </FsdFormItem>
      <FsdFormItem :label="t('login.password')">
        <FsdInput
          v-model="form.password"
          type="password"
          show-password
          :placeholder="t('login.passwordRequired')"
        />
      </FsdFormItem>
      <FsdButton type="primary" class="login__submit" :loading="auth.loading" @click="onSubmit">
        {{ t('login.submit') }}
      </FsdButton>
    </FsdForm>
  </div>
</template>

<style scoped lang="scss">
.login {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: var(--fsd-color-bg-page);
}

.login__form {
  width: 360px;
  padding: var(--fsd-space-lg);
  border-radius: var(--fsd-radius-md);
  background: var(--fsd-color-bg);
  box-shadow: var(--fsd-shadow-md);
}

.login__title {
  margin: 0 0 var(--fsd-space-md);
  font-size: var(--fsd-font-size-lg);
  text-align: center;
}

.login__submit {
  width: 100%;
}
</style>
