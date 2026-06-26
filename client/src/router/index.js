import { createRouter, createWebHistory } from 'vue-router'
import ConfigView from '../views/ConfigView.vue'
import HistoryView from '../views/HistoryView.vue'
import ProfileView from '../views/ProfileView.vue'

const routes = [
  { path: '/', redirect: '/history' },
  { path: '/history', name: 'History', component: HistoryView },
  { path: '/profile', name: 'Profile', component: ProfileView },
  { path: '/config', name: 'Config', component: ConfigView },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router