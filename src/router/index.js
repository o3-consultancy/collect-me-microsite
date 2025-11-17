import { createRouter, createWebHistory } from 'vue-router'
import CollectionRequest from '@/views/CollectionRequest.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/details'
    },
    {
      path: '/details',
      name: 'collection-request',
      component: CollectionRequest
    },
    {
      // Support the typo "deatils" (used in deployed QR codes)
      path: '/deatils',
      name: 'collection-request-typo',
      component: CollectionRequest
    },
    {
      // Catch-all route for any other invalid URLs
      path: '/:pathMatch(.*)*',
      redirect: to => {
        // Preserve the query parameters when redirecting
        return { path: '/details', query: to.query }
      }
    }
  ]
})

export default router
