import type { RouteRecordRaw } from 'vue-router'

export const LAYOUT_ROUTE_NAME = 'Layout'

/** 常量路由（docs/03 §2）：动态路由一律 addRoute 挂到 Layout 之下 */
export const constantRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/pages/login/index.vue'),
    meta: { title: '登录', hideInMenu: true, public: true },
  },
  {
    path: '/',
    name: LAYOUT_ROUTE_NAME,
    component: () => import('@/widgets/layout/AppLayout.vue'),
    redirect: '/dashboard',
    children: [], // 动态路由挂载到这里
  },
  {
    path: '/403',
    name: 'Forbidden',
    component: () => import('@/pages/error/403.vue'),
    meta: { public: true },
  },
  {
    // 404 必须最后注册
    // ★ 不能标 public：动态路由未注册时「刷新 /system/user」会先匹配到本通配，
    //   若 public 命中守卫的短路分支就永远不会去加载动态路由，页面直接落 404（实测踩坑）。
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/pages/error/404.vue'),
    meta: { public: false },
  },
]
