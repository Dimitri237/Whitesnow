import { createRouter, createWebHistory } from 'vue-router'
import { auth } from '../firebase'

import Login from '../views/LoginPage.vue'
import Dashboard from '../views/DashboardPage.vue'
import Products from '../views/ProductsPage.vue'
import Entries from '../views/EntriesPage.vue'
import Sales from '../views/SalesPage.vue'
import loadingPage from '../views/LoadingPage.vue'
import Clients from '../views/ClientsPage.vue'
import Suppliers from '../views/SuppliersPage.vue'

const routes = [
  { path: '/lod', component: loadingPage },
  { path: '/', component: Login },
  { path: '/dashboard', component: Dashboard, meta:{auth:true} },
  { path: '/products', component: Products, meta:{auth:true} },
  { path: '/entries', component: Entries, meta:{auth:true} },
  { path: '/sales', component: Sales, meta:{auth:true} },
  { path: '/clients', component: Clients, meta:{auth:true} },
  { path: '/suppliers', component: Suppliers, meta:{auth:true} },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, _, next) => {
  if (to.meta.auth && !auth.currentUser) next('/')
  else next()
})

export default router
