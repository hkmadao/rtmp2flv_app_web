import { createRouter, createWebHistory } from 'vue-router'
import Live from '../src/views/Live/index.vue'
import dynamicRoutes from './dynamic-routes';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'Live',
      component: Live
    },
    ...dynamicRoutes
  ]
})

export default router
