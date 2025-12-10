<template>
  <div id="login-container">
    <div class="login-card">
      <!-- 项目标题 -->
      <div class="login-header">
        <h1>财务处 AI 助手</h1>
        <p class="subtitle">智能问答系统</p>
      </div>

      <!-- 登录/注册选项卡 -->
      <div class="tabs">
        <button
            :class="['tab-btn', { active: activeTab === 'login' }]"
            @click="switchTab('login')"
        >
          登录
        </button>
        <button
            :class="['tab-btn', { active: activeTab === 'register' }]"
            @click="switchTab('register')"
        >
          注册
        </button>
      </div>

      <!-- 登录表单  -->
      <form v-if="activeTab === 'login'" @submit.prevent="handleLogin" class="form-container">
        <div class="form-group">
          <input
              v-model="loginForm.username"
              type="text"
              placeholder="用户名"
              required
              class="form-input"
              :disabled="loading"
          />
        </div>

        <div class="form-group">
          <input
              v-model="loginForm.password"
              type="password"
              placeholder="密码"
              required
              class="form-input"
              :disabled="loading"
          />
        </div>

        <button type="submit" class="submit-btn" :disabled="loading">
          <span v-if="loading">登录中...</span>
          <span v-else>登录</span>
        </button>
      </form>

      <!-- 注册表单  -->
      <form v-else @submit.prevent="handleRegister" class="form-container">
        <div class="form-group">
          <input
              v-model="registerForm.username"
              type="text"
              placeholder="用户名"
              required
              class="form-input"
              :disabled="loading"
          />
        </div>

        <div class="form-group">
          <input
              v-model="registerForm.password"
              type="password"
              placeholder="密码（至少6位）"
              required
              class="form-input"
              :disabled="loading"
          />
        </div>

        <div class="form-group">
          <input
              v-model="registerForm.confirmPassword"
              type="password"
              placeholder="确认密码"
              required
              class="form-input"
              :disabled="loading"
          />
        </div>

        <button type="submit" class="submit-btn" :disabled="loading">
          <span v-if="loading">注册中...</span>
          <span v-else>注册</span>
        </button>
      </form>

      <!-- 错误信息 -->
      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>

      <!-- 成功信息 -->
      <div v-if="successMessage" class="success-message">
        {{ successMessage }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useChatStore } from '../stores/chat'

const router = useRouter()
const chatStore = useChatStore()

// 选项卡状态
const activeTab = ref('login')
const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

// 登录表单数据
const loginForm = reactive({
  username: '',
  password: ''
})

// 注册表单数据
const registerForm = reactive({
  username: '',
  password: '',
  confirmPassword: '' // 只需要这三个字段
})

// 切换选项卡
const switchTab = (tab) => {
  activeTab.value = tab
  errorMessage.value = ''
  successMessage.value = ''

  // 清空表单
  if (tab === 'login') {
    // 清空注册表单
    registerForm.username = ''
    registerForm.password = ''
    registerForm.confirmPassword = ''
  } else {
    // 清空登录表单
    loginForm.username = ''
    loginForm.password = ''
  }
}

// 处理登录
const handleLogin = async () => {
  if (!loginForm.username.trim() || !loginForm.password.trim()) {
    errorMessage.value = '请输入用户名和密码'
    return
  }

  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const success = await chatStore.login({
      username: loginForm.username.trim(),
      password: loginForm.password.trim()
    })

    if (success) {
      // 登录成功，跳转到主页面
      router.push('/')
    } else {
      errorMessage.value = '登录失败，请检查用户名和密码'
    }
  } catch (error) {
    console.error('登录失败:', error)
    errorMessage.value = error.message || '登录失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

// 处理注册
const handleRegister = async () => {
  // 基础验证
  if (!registerForm.username.trim()) {
    errorMessage.value = '请输入用户名'
    return
  }

  if (!registerForm.password.trim()) {
    errorMessage.value = '请输入密码'
    return
  }

  if (registerForm.password.length < 6) {
    errorMessage.value = '密码长度至少6位'
    return
  }

  if (registerForm.password !== registerForm.confirmPassword) {
    errorMessage.value = '两次输入的密码不一致'
    return
  }

  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    // 调用store的注册方法，固定提交 role: "TEACHER"
    const success = await chatStore.register({
      username: registerForm.username.trim(),
      password: registerForm.password.trim(),
      role: "TEACHER" // 默认角色，固定提交
      // 不再提交 department 和 majorName 字段
    })

    if (success) {
      // 注册成功（自动登录）
      successMessage.value = '注册成功！正在跳转...'

      // 延迟跳转到主页面
      setTimeout(() => {
        router.push('/')
      }, 1500)
    } else {
      errorMessage.value = '注册失败，用户名可能已存在'
    }
  } catch (error) {
    console.error('注册失败:', error)
    errorMessage.value = error.message || '注册失败，请稍后重试'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
#login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-card {
  width: 100%;
  max-width: 400px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  padding: 40px 30px;
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-header h1 {
  margin: 0;
  color: #2c3e50;
  font-size: 24px;
  font-weight: 600;
}

.login-header .subtitle {
  margin: 8px 0 0;
  color: #7f8c8d;
  font-size: 14px;
}

.tabs {
  display: flex;
  margin-bottom: 25px;
  border-bottom: 1px solid #e8e8e8;
}

.tab-btn {
  flex: 1;
  padding: 12px;
  background: none;
  border: none;
  font-size: 16px;
  font-weight: 500;
  color: #7f8c8d;
  cursor: pointer;
  position: relative;
  transition: all 0.3s ease;
}

.tab-btn.active {
  color: #409eff;
  font-weight: 600;
}

.tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: #409eff;
}

.tab-btn:hover:not(.active) {
  color: #66b1ff;
}

.form-container {
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 15px;
}

.form-input {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.3s;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}

.form-input:disabled {
  background-color: #f5f7fa;
  cursor: not-allowed;
}

.submit-btn {
  width: 100%;
  padding: 12px;
  background: #409eff;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.3s;
  margin-top: 10px;
}

.submit-btn:hover:not(:disabled) {
  background: #66b1ff;
}

.submit-btn:disabled {
  background: #a0cfff;
  cursor: not-allowed;
}

.error-message {
  padding: 10px;
  background: #fef0f0;
  color: #f56c6c;
  border-radius: 4px;
  font-size: 14px;
  text-align: center;
  margin-top: 15px;
  border: 1px solid #fde2e2;
}

.success-message {
  padding: 10px;
  background: #f0f9eb;
  color: #67c23a;
  border-radius: 4px;
  font-size: 14px;
  text-align: center;
  margin-top: 15px;
  border: 1px solid #e1f3d8;
}
</style>