<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { FsdButton, FsdForm, FsdFormItem, FsdInput } from '@repo/ui'
import { login } from '@/shared/api'
import { storage } from '@repo/utils'
import { TOKEN_KEY } from '@/shared/config/storage-keys'

defineOptions({ name: 'LoginPage' })

const router = useRouter()
const form = ref({ username: 'admin', password: 'admin123' })
const loading = ref(false)

async function onSubmit(): Promise<void> {
  loading.value = true
  try {
    const { token } = await login(form.value.username, form.value.password)
    storage.set(TOKEN_KEY, token)
    ElMessage.success('登录成功')
    await router.replace('/')
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '登录失败')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login">
    <FsdForm class="login__form" :model="form">
      <h1 class="login__title">登录</h1>
      <FsdFormItem label="用户名">
        <FsdInput v-model="form.username" placeholder="请输入用户名" />
      </FsdFormItem>
      <FsdFormItem label="密码">
        <FsdInput v-model="form.password" type="password" show-password placeholder="请输入密码" />
      </FsdFormItem>
      <FsdButton type="primary" class="login__submit" :loading="loading" @click="onSubmit">
        登录
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
