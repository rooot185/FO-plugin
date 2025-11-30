import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import './style.css'
import App from './App.vue'
import ChatMain from './components/ChatMain.vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import HistoryPage from './components/HistoryPage.vue'
/* import the fontawesome core */
import { library } from '@fortawesome/fontawesome-svg-core'
/* import font awesome icon component */
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
/* import specific icons */
import { faThumbsUp, faThumbsDown } from '@fortawesome/free-solid-svg-icons'

/* add icons to the library */
library.add(faThumbsUp, faThumbsDown)

const routes = [
  { path: '/', component: ChatMain },
  { path: '/history', component: HistoryPage },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

const pinia = createPinia()
const app = createApp(App)

app.use(pinia)
app.use(ElementPlus)
app.use(router)

app.component('font-awesome-icon', FontAwesomeIcon)

app.mount('#app')
