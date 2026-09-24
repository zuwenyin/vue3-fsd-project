import { createRouter, createWebHistory } from 'vue-router'
import { constantRoutes } from './constant-routes'

export const router = createRouter({
  history: createWebHistory(),
  routes: constantRoutes,
})

export { constantRoutes, LAYOUT_ROUTE_NAME } from './constant-routes'
