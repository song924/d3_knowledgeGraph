import Vue from 'vue'
import VueRouter from 'vue-router'
// import Test from '../views/Test.vue'

Vue.use(VueRouter)

const routes = [
  /* {
    path: '/',
    name: 'Test',
    component: Test
  }, */
  {
    path: '/',
    name: 'Home',
    component: () => import(/* webpackChunkName: "about" */ '../views/2dView.vue')
  },
  {
    path: '/3dView',
    name: '3dView',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "about" */ '../views/3dView.vue')
  }
]

const router = new VueRouter({
  routes
})

export default router
