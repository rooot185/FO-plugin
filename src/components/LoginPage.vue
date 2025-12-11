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
              placeholder="用户名 (4-16位字母、数字、下划线或连字符)"
              required
              class="form-input"
              :disabled="loading"
              @input="clearValidation('username')"
          />
          <div v-if="loginUsernameError" class="input-error">
            {{ loginUsernameError }}
          </div>
        </div>

        <div class="form-group">
          <input
              v-model="loginForm.password"
              type="password"
              placeholder="密码 (8-56位字母、数字或符号)"
              required
              class="form-input"
              :disabled="loading"
              @input="clearValidation('password')"
          />
          <div v-if="loginPasswordError" class="input-error">
            {{ loginPasswordError }}
          </div>
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
              placeholder="用户名 (4-16位字母、数字、下划线或连字符)"
              required
              class="form-input"
              :disabled="loading"
              @input="clearValidation('regUsername')"
          />
          <div v-if="regUsernameError" class="input-error">
            {{ regUsernameError }}
          </div>
        </div>

        <div class="form-group">
          <input
              v-model="registerForm.password"
              type="password"
              placeholder="密码 (8-56位字母、数字或符号)"
              required
              class="form-input"
              :disabled="loading"
              @input="clearValidation('regPassword')"
          />
          <div v-if="regPasswordError" class="input-error">
            {{ regPasswordError }}
          </div>
        </div>

        <div class="form-group">
          <input
              v-model="registerForm.confirmPassword"
              type="password"
              placeholder="确认密码"
              required
              class="form-input"
              :disabled="loading"
              @input="clearValidation('confirmPassword')"
          />
          <div v-if="confirmPasswordError" class="input-error">
            {{ confirmPasswordError }}
          </div>
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

// 登录表单验证错误
const loginUsernameError = ref('')
const loginPasswordError = ref('')

// 注册表单数据
const registerForm = reactive({
  username: '',
  password: '',
  confirmPassword: '' // 只需要这三个字段
})

// 注册表单验证错误
const regUsernameError = ref('')
const regPasswordError = ref('')
const confirmPasswordError = ref('')

// 正则表达式
const USERNAME_REGEX = /^[a-zA-Z0-9_-]{4,16}$/
const PASSWORD_REGEX = /^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,56}$/

// 验证用户名
const validateUsername = (username, isLogin = false) => {
  if (!username.trim()) {
    return '请输入用户名'
  }

  if (username.length < 4 || username.length > 16) {
    return '用户名长度必须在4-16位之间'
  }

  if (!USERNAME_REGEX.test(username)) {
    return '用户名只能包含字母、数字、下划线(_)或连字符(-)'
  }

  return ''
}

// 验证密码
const validatePassword = (password, isLogin = false) => {
  if (!password.trim()) {
    return '请输入密码'
  }

  if (password.length < 8 || password.length > 56) {
    return '密码长度必须在8-56位之间'
  }

  if (!isLogin && !PASSWORD_REGEX.test(password)) {
    return '密码只能包含字母、数字和符号'
  }

  return ''
}

// 验证确认密码
const validateConfirmPassword = (password, confirmPassword) => {
  if (!confirmPassword.trim()) {
    return '请确认密码'
  }

  if (password !== confirmPassword) {
    return '两次输入的密码不一致'
  }

  return ''
}

// 清除特定验证错误
const clearValidation = (field) => {
  switch (field) {
    case 'username':
      loginUsernameError.value = ''
      break
    case 'password':
      loginPasswordError.value = ''
      break
    case 'regUsername':
      regUsernameError.value = ''
      break
    case 'regPassword':
      regPasswordError.value = ''
      break
    case 'confirmPassword':
      confirmPasswordError.value = ''
      break
  }

  // 同时清除全局错误信息
  if (errorMessage.value) {
    errorMessage.value = ''
  }
}

// 切换选项卡
const switchTab = (tab) => {
  activeTab.value = tab
  errorMessage.value = ''
  successMessage.value = ''

  // 清空所有验证错误
  loginUsernameError.value = ''
  loginPasswordError.value = ''
  regUsernameError.value = ''
  regPasswordError.value = ''
  confirmPasswordError.value = ''

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
  // 验证用户名
  loginUsernameError.value = validateUsername(loginForm.username, true)
  if (loginUsernameError.value) return

  // 验证密码
  loginPasswordError.value = validatePassword(loginForm.password, true)
  if (loginPasswordError.value) return

  // 清除全局错误信息
  errorMessage.value = ''
  successMessage.value = ''

  loading.value = true

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
  let hasError = false

  // 验证用户名
  regUsernameError.value = validateUsername(registerForm.username)
  if (regUsernameError.value) hasError = true

  // 验证密码
  regPasswordError.value = validatePassword(registerForm.password)
  if (regPasswordError.value) hasError = true

  // 验证确认密码
  confirmPasswordError.value = validateConfirmPassword(registerForm.password, registerForm.confirmPassword)
  if (confirmPasswordError.value) hasError = true

  if (hasError) return

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
  /* 使用固定定位或背景扩展确保覆盖整个视口 */
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  /* 确保背景扩展到边缘 */
  margin: 0;
  width: 100vw;
  box-sizing: border-box;
  overflow: auto; /* 允许滚动 */
}

.login-card {
  width: 100%;
  max-width: 400px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  padding: 40px 30px;
  /* 确保卡片居中 */
  margin: auto;
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

.input-error {
  color: #f56c6c;
  font-size: 12px;
  margin-top: 5px;
  min-height: 18px;
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