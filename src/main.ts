import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import './style.css'
import App from './App.vue'
import ChatMain from './components/ChatMain.vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import HistoryPage from './components/HistoryPage.vue'
import LoginPage from './components/LoginPage.vue' // 新增导入

/* import the fontawesome core */
import { library } from '@fortawesome/fontawesome-svg-core'
/* import font awesome icon component */
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
/* import specific icons */
import { faThumbsUp, faThumbsDown } from '@fortawesome/free-solid-svg-icons'

/* add icons to the library */
library.add(faThumbsUp, faThumbsDown)

// 路由配置
const routes = [
  {
    path: '/',
    component: ChatMain,
    meta: { requiresAuth: true }  // 需要登录
  },
  {
    path: '/login',
    component: LoginPage
  },
  {
    path: '/history',
    component: HistoryPage,
    meta: { requiresAuth: true }  // 需要登录
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

const pinia = createPinia()
const app = createApp(App)

// 路由守卫
router.beforeEach(async (to, _from, next) => {
  // 创建 pinia 实例
  const chatStore = useChatStore()

  // 检查路由是否需要认证
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)

  if (requiresAuth && !chatStore.isAuthenticated) {
    // 需要登录但未登录，跳转到登录页
    console.log('需要登录，跳转到登录页')
    next('/login')
  } else if (to.path === '/login' && chatStore.isAuthenticated) {
    // 已登录但访问登录页，跳转到首页
    console.log('已登录，跳转到首页')
    next('/')
  } else {
    // 正常放行
    next()
  }
})

app.use(pinia)
app.use(ElementPlus)
app.use(router)

app.component('font-awesome-icon', FontAwesomeIcon)

app.mount('#app')

// 导出 useChatStore，方便在路由守卫中使用
import { useChatStore } from './stores/chat'