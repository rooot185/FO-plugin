import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import './style.css'
import App from './App.vue' // App is now the main layout component
import ChatMain from './components/ChatMain.vue' // Import the new ChatMain component
import { createRouter, createWebHashHistory } from 'vue-router'
import HistoryPage from './components/HistoryPage.vue'

const routes = [
  { path: '/', component: ChatMain }, // Use ChatMain for the root path
  { path: '/history', component: HistoryPage },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

const pinia = createPinia()
const app = createApp(App) // Mount the App component as the main entry point

app.use(pinia)
app.use(ElementPlus)
app.use(router)
app.mount('#app')
