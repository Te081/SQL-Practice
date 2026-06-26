import { createRouter, createWebHistory } from 'vue-router'
import ConfigView from '../views/ConfigView.vue'
import PracticeView from '../views/PracticeView.vue'
import HistoryView from '../views/HistoryView.vue'

const routes = [
  { path: '/', redirect: '/practice' },
  { path: '/practice', name: 'Practice', component: PracticeView },
  { path: '/config', name: 'Config', component: ConfigView },
  { path: '/history', name: 'History', component: HistoryView },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
