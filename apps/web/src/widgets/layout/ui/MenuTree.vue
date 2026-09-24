<script setup lang="ts">
import { FsdIcon, FsdMenuItem, FsdSubMenu } from '@repo/ui'
import { resolveMenuTitle, type MenuItem } from '@/entities/menu'

defineOptions({ name: 'MenuTree' })

const props = defineProps<{ items: MenuItem[] }>()
</script>

<template>
  <template v-for="item in props.items" :key="item.key">
    <FsdSubMenu v-if="item.children?.length" :index="item.path">
      <template #title>
        <FsdIcon v-if="item.icon" :name="item.icon" />
        <span>{{ resolveMenuTitle(item) }}</span>
      </template>
      <MenuTree :items="item.children" />
    </FsdSubMenu>

    <FsdMenuItem v-else :index="item.path" :icon="item.icon">
      {{ resolveMenuTitle(item) }}
    </FsdMenuItem>
  </template>
</template>
