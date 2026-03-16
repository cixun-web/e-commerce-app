import { createWebHashHistory, createRouter } from 'vue-router'

const routes = [
  { path: '/', component: () => import('@renderer/views/home.vue') },
  { path: '/download-video', component: () => import('@renderer/views/download-video/index.vue') },
  { path: '/video-deal', component: () => import('@renderer/views/video-deal/index.vue') },
  { path: '/page-info', component: () => import('@renderer/views/page-info/index.vue') },
  { path: '/data-info', component: () => import('@renderer/views/data-info/index.vue') },
  { path: '/online-table', component: () => import('@renderer/views/online-table/index.vue') },
  { path: '/back-manage', component: () => import('@renderer/views/back-manage/index.vue') },
  { path: '/ui', component: () => import('@renderer/views/ui/index.vue') }
]

/**
 * 创建路由实例
 */
const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
