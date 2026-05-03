import { createRouter, createWebHistory } from 'vue-router'
import ShareWithMe from '../src/views/ShareWithMe/index.vue'
import dynamicRoutes from './dynamic-routes';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'ShareWithMe',
      component: ShareWithMe
    },
    ...dynamicRoutes
  ]
})

export default router
